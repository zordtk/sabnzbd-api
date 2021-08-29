// SABnzbd-API
//   https://github.com/zordtk/sabnzbd-api
//   Written By Jeremy Harmon <jeremy.harmon@zoho.com>

import got from "got";
import {Stats,ErrorType,ErrorWarning,ServerStats,Queue,QueueSlot,CompleteAction,SortOptions,Priority,PostProcessing,File,Results} from "./Types";
import FormData = require("form-data");
import { resolve } from "path/posix";
import { resolveCaa } from "dns";
 
export class Client {
    private mHost: string;
    private mApiKey: string;

    /**
     * 
     * @param host Hostname of the SABnzbd server. Include HTTP/HTTPS prefix
     * @param apiKey API key from the SABnzbd configuration
     */
    constructor(host: string, apiKey: string) {
        this.mHost      = host;
        this.mApiKey    = apiKey;
    }

    /**
     * Full queue output with details about all jobs.
     * 
     * @param start Index of job to start at
     * @param limit Number of jobs to display
     * @param search Filter jobs names by search term
     * @param nzoIds Filter jobs by nzo_ids
     * @returns
     * @throws {Error} throws error if unable to reach SABnzbd server
     */
    async queue(start: number|undefined = undefined, limit: number|undefined = undefined, search: string|undefined = undefined, nzoIds: string[]|undefined = undefined) {
        let searchParams = new URLSearchParams();
        if( start )
            searchParams.append("start", String(start));
        if( limit )
            searchParams.append("limit", String(limit));
        if( search ) 
            searchParams.append("search", search);
        if( nzoIds ) 
            searchParams.append("nzo_ids", nzoIds.join(","));
        
        let resultsObj = await this.methodCall("queue", searchParams);
        return <Queue>resultsObj.queue;
    }

    /**
     * Pauses the whole queue
     * @returns true or false depending on if the call was successful
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    queuePause(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("pause");
            resolve(results);
        });
    }

    /**
     * Resume the whole queue
     * @returns true or false depending on if the call was successful
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    queueResume(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("resume");
            resolve(results);
        });
    }

    /**
     * Sort the queue by {@link SortOptions.AverageAge}, {@link SortOptions.Name} or {@link SortOptions.Size} in Ascending or Descending order.
     * @param sortBy 
     * @param ascending Ascending or false for Descending order
     * @returns true or false dpending on if the call was successful
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    queueSort(sortBy: SortOptions, ascending: boolean): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("queue", {name: "sort", "dir": (ascending ? "asc" : "desc"), sort: sortBy});
            resolve(results);
        });
    }

    /**
     * Remove all jobs from the queue, or only the ones matching search. Returns nzb_id of the jobs removed.
     * @param search Filter jobs by search term
     * @returns Array of nzb_id's of the jobs removed, or undefined if call was unsuccessful
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    queuePurge(search: string|undefined = undefined): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            let searchParams = new URLSearchParams();
            searchParams.append("name", "purge");
            searchParams.append("del_files", "1");
            if( search ) searchParams.append("search", search);

            let results: Results = await this.methodCall("queue", searchParams);
            resolve(results);
        });
    }

    /**
     * Set an end-of-queue action
     * @param action Either one of {@link CompleteAction} or a string contaning the name of a script to execute. Prefix the script name
     * with script_ example: script_process.py
     * @returns true or false depending if the call was successful
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    changeCompleteAction(action: CompleteAction|string): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("change_complete_action", {value: action});
            resolve(results);
        });
    }

    /**
     * Add NZB using an URL that needs to be accessible by SABnzbd, so make sure to include authentication information if the Indexer requires it. 
     * @param url URL of the NZB file to add
     * @param name Name of the job, if empty NZB filename is used.
     * @param password Password to use when unpacking the job.
     * @param cat Category to be assigned, * means Default. List of available categories can be retrieved from {@link getCats}.
     * @param script Script to be assigned, Default will use the script assigned to the category. List of available scripts can be retrieved from {@link getScripts}.
     * @param priority Priority to be assigned, one of {@link Priority}
     * @param postProcess Post-processing options, one of {@link PostProcessing}
     * @returns The nzo_id on success
     * @throw {Error} throws error if adding was unsucessful
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    addUrl(url: string, name: string|undefined = undefined, password: string|undefined = undefined, cat: string|undefined = undefined, script: string|undefined = undefined,
                 priority: Priority|undefined = undefined, postProcess: PostProcessing|undefined = undefined): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            let searchParams = new URLSearchParams();

            searchParams.append("name", url);
            if( name )          searchParams.append("nzbname", name);
            if( password )      searchParams.append("password", password);
            if( cat)            searchParams.append("cat", cat);
            if( script )        searchParams.append("script", script);
            if( priority )      searchParams.append("priority", priority.toString());
            if( postProcess )   searchParams.append("pp", postProcess.toString());
            
            let results: Results = await this.methodCall("addurl", searchParams);
            resolve(results);
        });
    }

    /**
     * Upload NZB from a location on the file system that SABnzbd can access. 
     * @param filePath Path to the file to add
     * @param name Name of the job, if empty NZB filename is used.
     * @param password Password to use when unpacking the job.
     * @param cat Category to be assigned, * means Default. List of available categories can be retrieved from {@link getCats}.
     * @param script Script to be assigned, Default will use the script assigned to the category. List of available scripts can be retrieved from {@link getScripts}.
     * @param priority Priority to be assigned, one of {@link Priority}
     * @param postProcess Post-processing options, one of {@link PostProcessing}
     * @returns The nzo_id on success
     * @throw {Error} throws error if adding was unsucessful
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    addPath(filePath: string, name: string|undefined = undefined, password: string|undefined = undefined, cat: string|undefined = undefined, script: string|undefined = undefined,
                  priority: Priority|undefined = undefined, postProcess: PostProcessing|undefined = undefined): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            let searchParams = new URLSearchParams();

            searchParams.append("name", filePath);
            if( name )          searchParams.append("nzbname", name);
            if( password )      searchParams.append("password", password);
            if( cat)            searchParams.append("cat", cat);
            if( script )        searchParams.append("script", script);
            if( priority )      searchParams.append("priority", priority.toString());
            if( postProcess )   searchParams.append("pp", postProcess.toString());
            
            let results: Results = await this.methodCall("addlocalfile", searchParams);
            resolve(results);
        });
    }

    /**
     * Upload NZB using POST multipart/form-data with the FormData library. You must
     * set the file data to either the name or nzbfile field.
     * @param formData The FormData with the file in either the name or nzbfile field.
     * @param name Name of the job, if empty NZB filename is used.
     * @param password Password to use when unpacking the job.
     * @param cat Category to be assigned, * means Default. List of available categories can be retrieved from {@link getCats}.
     * @param script Script to be assigned, Default will use the script assigned to the category. List of available scripts can be retrieved from {@link getScripts}.
     * @param priority Priority to be assigned, one of {@link Priority}
     * @param postProcess Post-processing options, one of {@link PostProcessing}
     * @returns The nzo_id on success
     * @throw {Error} throws error if adding was unsucessful
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    addFile(formData: FormData, name: string|undefined = undefined, password: string|undefined = undefined, cat: string|undefined = undefined, script: string|undefined = undefined,
                  priority: Priority|undefined = undefined, postProcess: PostProcessing|undefined = undefined): Promise<Results> {
        return new Promise<Results>((resolve, reject) => {
            formData.append("mode", "addfile");
            formData.append("output", "json");
            formData.append("apikey", this.mApiKey);

            if( name )          formData.append("nzbname", name);
            if( password )      formData.append("password", password);
            if( cat)            formData.append("cat", cat);
            if( script )        formData.append("script", script);
            if( priority )      formData.append("priority", priority.toString());
            if( postProcess )   formData.append("pp", postProcess.toString());

            try {
                got.post(`${this.mHost}/api`, {body: formData}).then(response => {
                    if( response.statusCode === 200 ) {
                        let resultObject: Results = JSON.parse(response.body);
                        resolve(resultObject);
                    }
                }).catch(error => {
                    if( error instanceof Error )
                        reject(new Error(`Error accessing SABnzbd host: ${error.message}`));
                    else
                        reject(new Error('Error accessing SABnzbd host'));
                });
            } catch( error ) {
                reject(new Error('Error parsing response as JSON'));
            }
        });
    }

    /**
     * Pause a single job based on its nzo_id. Returns list of affected nzo_ids.
     * @param id 
     * @returns List of affected nzo_ids
     * @throw {Error} throws error if unable to reach SABnzbd server
     */
    jobPause(id: string): Promise<Results> {
        return new Promise<Results>(async resolve =>{
            let results: Results = await this.methodCall("queue", {name: "pause", value: id});
            resolve(results);
        });
    }

    /**
     * Resumes a single job based on its nzo_id. Returns list of affected nzo_ids.
     * @param id 
     * @returns List of affected nzo_ids
     */
    jobResume(id: string): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results = await this.methodCall("queue", {name: "resume", value: id});
            resolve(results);
        });
    }

    /**
     * Delets jobs based on its nzo_id. Returns list of affected nzo_ids.
     * @param id Either a string containing one nzo_id or a array of nzo_ids
     * @returns List of affected nzo_ids
     */
    jobDelete(id: string|string[]): Promise<Results> {
        return new Promise<Results>(async resolve => {
            if( id instanceof Array ) {
                let results: Results = await this.methodCall("queue", {name: "delete", value: id.join(",")});
                resolve(results);
            } else {
                let results: Results = await this.methodCall("queue", {name: "delete", value: id});
                resolve(results);
            }
        });
    }

    /**
     * Delete all jobs
     * @returns List of affected nzo_ids
     */
    jobDeleteAll(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("queue", {name: "delete", value: "all", del_files: 1});
            resolve(results);
        });
    }

    jobMove(firstId: string, secondId: string): Promise<any> {
        return new Promise<any>(async resolve => {
            let results: Results = await this.methodCall("switch", {value: firstId, value2: secondId});
            resolve(results);
        });
    }

    jobChangeName(id: string, newName: string, password: string|undefined): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let searchParams = new URLSearchParams();
            searchParams.append("name", "rename");
            searchParams.append("value", id);
            searchParams.append("value2", newName);
            if( password ) searchParams.append("value3", password);

            let results: Results = await this.methodCall("queue", searchParams);
            resolve(results);
        });
    }

    changeCat(id: string, category: string): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("change_cat", {value: id, value2: category});
            resolve(results);
        });
    }

    changeScript(id: string, script: string): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("change_script", {value: id, value2: script});
            resolve(results);
        });
    }

    changePriority(id: string, priority: Priority): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("queue", {name: priority, value: id, value2: priority});
            resolve(results);
        });
    }

    changePostProcessing(id: string, postProcessing: PostProcessing): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("change_opts", {value: id, value2: postProcessing});
            resolve(results);
        });
    }

    getFiles(id: string): Promise<File[]> {
        return new Promise<File[]>(async resolve => {
            let results = await this.methodCall("get_files", {value: id});
            resolve(<File[]>results.files);
        });
    }

    version(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            let results = await this.methodCall("version");
            if( results.version )
                resolve(results.version);
            else
                reject(new Error("Invalid response from SABnzbd"));
        });
    }

    auth(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            let results = await this.methodCall("auth");
            if( results.auth )
                resolve(results.auth);
            else
                reject(new Error("Invalid response from SABnzbd"));
        });
    }

    async warnings(): Promise<ErrorWarning[]> {
        return new Promise<ErrorWarning[]>(async (resolve, reject) => {
            let results = await this.methodCall("warnings");
            let warnings: ErrorWarning[] = [];

            for( let result of results ) {
                if( !result.text || result.type !== "WARNING" || !result.time )
                    reject(new Error("Invalid response from SABnzbd"));
                warnings.push({text: result.text, type: ErrorType.Warning, time: result.time});    
            }

            resolve(warnings);
        });
    }

    warningsClear(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("warnings", {name: "clear"});
            resolve(results);
        });
    }

    getCats(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            let results = await this.methodCall("get_cats");

            if( !results.categories )
                reject(new Error("Invalid response from SABnzbd"));
            else
                resolve(results.categories);
        });
    }

    getScripts(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            let results = await this.methodCall("get_scripts");
            if( !results.scripts )
                reject(new Error("Invalid response from SABnzbd"));
            else
                resolve(results.scripts);
        });
    }

    serverStats(): Promise<Stats> {
        return new Promise<Stats>(async (resolve, reject) => {
            let results = await this.methodCall("server_stats");

            let stats: Stats = {
                day: results.day,
                week: results.week,
                month: results.month,
                total: results.total,
                servers: new Map<string, ServerStats>()
            };

            for( let serverName in results.servers ) {
                let serverResult = results.servers[serverName];
                let server: ServerStats = {
                    day: serverResult.day,
                    week: serverResult.week,
                    month: serverResult.month,
                    total: serverResult.total,
                    daily: new Map<string, number>(),
                    articles_tried: new Map<string, number>(),
                    articles_success: new Map<string, number>()
                };

                for( let dailyDate in serverResult.daily ) 
                    server.daily.set(dailyDate, serverResult.daily[dailyDate]);

                for( let articlesTriedDate in serverResult.articles_tried )
                    server.articles_tried.set(articlesTriedDate, serverResult.articles_tried[articlesTriedDate]);

                    for( let articlesSuccessDate in serverResult.articles_success )
                        server.articles_success.set(articlesSuccessDate, serverResult.articles_tried[articlesSuccessDate]);

                stats.servers.set(serverName, server);
            }

            resolve(stats);
        });
    }

    getConfig(section: string|undefined = undefined, keyword: string|undefined = undefined): Promise<any> {
        return new Promise<any>(async resolve => {
            let options: any    = {};
            if( section )
                options.section = section;
            if( keyword )
                options.keyword = keyword;

            let serverConfig = await this.methodCall("get_config", options);
            resolve(serverConfig);
        });
    }

    setConfig(args: any): Promise<any> {
        return new Promise<any>(async resolve => {
            let results = await this.methodCall("set_config", args);
            resolve(results);
        });
    }

    setConfigDefault(keyword: string|string[]): Promise<Results> {
        return new Promise<Results>(async resolve => {
            if( keyword instanceof Array ) {
                let searchParams = new URLSearchParams();
                for( let value of keyword ) 
                    searchParams.append("keyword", value);

                let results: Results = await this.methodCall("set_config_default", searchParams);
                resolve(results);
            } else {
                let results: Results = await this.methodCall("set_config_default", {keyword: keyword});
                resolve(results);
            }
        });
    }

    translateText(text: string): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            let results = await this.methodCall("translate", {value: text});
            if( results.value )
                return results.value;
            else
	            reject(new Error('Error in API call' + (results.error ? `: ${results.error}` : '')));
        });
    }

    shutdown(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("shutdown");
            resolve(results);
        });
    }

    restart(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("restart");
            resolve(results);
        });
    }

    restartRepair(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("restart_repair");
            resolve(results);
        });
    }

    pausePostProcessing(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("pause_pp");
            resolve(results);
        });
    }

    rssNow(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("rss_now");
            resolve(results);
        });
    }

    watchedNow(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("watched_now");
            resolve(results);
        });
    }

    async resetQuota(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("reset_quota");
            resolve(results);
        });
    }

    private methodCall(method: string, args: URLSearchParams|any|undefined = undefined, output: string = 'json'): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let apiUrl = new URL(`${this.mHost}/api`);
            if( args ) {
                if( args instanceof URLSearchParams ) {
                    for( let param of args.keys() ) {
                        apiUrl.searchParams.append(param, args.get(param) ?? '');
                    }
                } else {
                    for( let argKey in args ) {
                        apiUrl.searchParams.append(argKey, args[argKey]);
                    }
                }
            }

            apiUrl.searchParams.append("mode", method);
            apiUrl.searchParams.append("output", output);
            apiUrl.searchParams.append("apikey", this.mApiKey);

            try {
                got(apiUrl).then(response => {
                    if( response.statusCode === 200 ) {
                        if( output === 'json') {
                            let responseObject = JSON.parse(response.body);
                            resolve(responseObject);
                        } else {
                            resolve(response.body);
                        }
                    }
                }).catch(error => {
                    if( error instanceof Error ) 
                        reject(new Error('Error accessing SABnzbd host: ' + error.message));
                    else
                        reject(new Error('Error accessing SABnzbd host'));
                });
            } catch( error ) {
                reject(new Error('Error parsing response as JSON'));
            }
        });
    }
}
