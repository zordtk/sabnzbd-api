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
     * @param host - Hostname of the SABnzbd server. Include HTTP/HTTPS prefix
     * @param apiKey - API key from the SABnzbd configuration
     */
    constructor(host: string, apiKey: string) {
        this.mHost      = host;
        this.mApiKey    = apiKey;
    }

    /**
     * Full queue output with details about all jobs.
     * 
     * @param start - Index of job to start at
     * @param limit - Number of jobs to display
     * @param search - Filter jobs names by search term
     * @param nzoIds - Filter jobs by nzo_ids
     * @returns {@link Queue}
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
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    queuePause(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("pause");
            resolve(results);
        });
    }

    /**
     * Resume the whole queue
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    queueResume(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("resume");
            resolve(results);
        });
    }

    /**
     * Sort the queue by {@link SortOptions.AverageAge}, {@link SortOptions.Name} or {@link SortOptions.Size} in Ascending or Descending order.
     * @param sortBy - The option to sort queue by
     * @param ascending - Ascending or false for Descending order
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    queueSort(sortBy: SortOptions, ascending: boolean): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("queue", {name: "sort", "dir": (ascending ? "asc" : "desc"), sort: sortBy});
            resolve(results);
        });
    }

    /**
     * Remove all jobs from the queue, or only the ones matching search. Returns nzb_id of the jobs removed.
     * @param search - Filter jobs by search term
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
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
     * @param action - Either one of {@link CompleteAction} or a string contaning the name of a script to execute. Prefix the script name
     * with script_ example: script_process.py
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changeCompleteAction(action: CompleteAction|string): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("change_complete_action", {value: action});
            resolve(results);
        });
    }

    /**
     * Add NZB using an URL that needs to be accessible by SABnzbd, so make sure to include authentication information if the Indexer requires it. 
     * @param url - URL of the NZB file to add
     * @param name - Name of the job, if empty NZB filename is used.
     * @param password - Password to use when unpacking the job.
     * @param cat - Category to be assigned, * means Default. List of available categories can be retrieved from {@link getCats}.
     * @param script - Script to be assigned, Default will use the script assigned to the category. List of available scripts can be retrieved from {@link getScripts}.
     * @param priority - Priority to be assigned, one of {@link Priority}
     * @param postProcess - Post-processing options, one of {@link PostProcessing}
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
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
     * @param filePath - Path to the file to add
     * @param name - Name of the job, if empty NZB filename is used.
     * @param password - Password to use when unpacking the job.
     * @param cat - Category to be assigned, * means Default. List of available categories can be retrieved from {@link getCats}.
     * @param script - Script to be assigned, Default will use the script assigned to the category. List of available scripts can be retrieved from {@link getScripts}.
     * @param priority - Priority to be assigned, one of {@link Priority}
     * @param postProcess - Post-processing options, one of {@link PostProcessing}
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
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
     * @param formData - The FormData with the file in either the name or nzbfile field.
     * @param name - Name of the job, if empty NZB filename is used.
     * @param password - Password to use when unpacking the job.
     * @param cat - Category to be assigned, * means Default. List of available categories can be retrieved from {@link getCats}.
     * @param script - Script to be assigned, Default will use the script assigned to the category. List of available scripts can be retrieved from {@link getScripts}.
     * @param priority - Priority to be assigned, one of {@link Priority}
     * @param postProcess - Post-processing options, one of {@link PostProcessing}
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
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
     * @param id - The nzo_id of the Job to pause
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobPause(id: string): Promise<Results> {
        return new Promise<Results>(async resolve =>{
            let results: Results = await this.methodCall("queue", {name: "pause", value: id});
            resolve(results);
        });
    }

    /**
     * Resumes a single job based on its nzo_id. Returns list of affected nzo_ids.
     * @param id - The nzo_id of the Job to resume 
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobResume(id: string): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results = await this.methodCall("queue", {name: "resume", value: id});
            resolve(results);
        });
    }

    /**
     * Delets jobs based on its nzo_id. Returns list of affected nzo_ids.
     * @param id - Either a string containing one nzo_id or a array of nzo_ids
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
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
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobDeleteAll(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("queue", {name: "delete", value: "all", del_files: 1});
            resolve(results);
        });
    }

    /**
     * Job's can be switched by providing 2 nzo_id, firstId is the item you want to move, secondId is the id of the job where 
     * you want to put value one above, shifting job secondId down.
     * @param firstId - nzo_id of job to move
     * @param secondId - nzo_id of where you want to put the job, shifting this job down.
     * @returns 
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobMove(firstId: string, secondId: string): Promise<any> {
        return new Promise<any>(async resolve => {
            let results: Results = await this.methodCall("switch", {value: firstId, value2: secondId});
            resolve(results);
        });
    }

    /**
     * Change name and optionally the password of job with nzo_id.
     * @param id - nzo_id of the Job
     * @param newName - New name for the job
     * @param password - Optional password to be used during unpacking
     * @returns {@link Results.Status} set to true or false if the call was successful
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
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

    /**
     * Change category of job with nzo_id. List of available categories can be retrieved from {@link getCats}.
     * @param id - The nzo_id of the Job to change
     * @param category - The name of the category
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changeCat(id: string, category: string): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("change_cat", {value: id, value2: category});
            resolve(results);
        });
    }

    /**
     * Change script of job with nzo_id. List of available scripts can be retrieved from {@link getScripts}.
     * @param id - The nzo_id of the Job to change
     * @param script - The script name
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changeScript(id: string, script: string): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("change_script", {value: id, value2: script});
            resolve(results);
        });
    }

    /**
     * Change priority of job.
     * @param id - The nzo_id of the Job to change
     * @param priority - The priority
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changePriority(id: string, priority: Priority): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("queue", {name: priority, value: id, value2: priority});
            resolve(results);
        });
    }

    /**
     * Change post-processing of job.
     * @param id - The nzo_id of the Job to change
     * @param postProcessing - The PostProcessing level
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changePostProcessing(id: string, postProcessing: PostProcessing): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("change_opts", {value: id, value2: postProcessing});
            resolve(results);
        });
    }

    /**
     * Get files of job
     * @param id - The nzo_id of the Job
     * @returns Any array of {@link File}
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    getFiles(id: string): Promise<File[]> {
        return new Promise<File[]>(async resolve => {
            let results = await this.methodCall("get_files", {value: id});
            resolve(<File[]>results.files);
        });
    }

    /**
     * Get version of running SABnzbd
     * @returns String containing the version information
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    version(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            let results = await this.methodCall("version");
            if( results.version )
                resolve(results.version);
            else
                reject(new Error("Invalid response from SABnzbd"));
        });
    }

    /**
     * Get authentication methods available for interaction with the API
     * @returns An array of auth methods
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    auth(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            let results = await this.methodCall("auth");
            if( results.auth )
                resolve(results.auth);
            else
                reject(new Error("Invalid response from SABnzbd"));
        });
    }

    /**
     * Get all active warnings
     * @returns An array of {@link ErrorWarning} describing all warnings.
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
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

    /**
     * Clear all active warnings
     * @returns {@link Results} containing the status
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    warningsClear(): Promise<Results> {
        return new Promise<Results>(async resolve => {
            let results: Results = await this.methodCall("warnings", {name: "clear"});
            resolve(results);
        });
    }

    /**
     * Get all categories
     * @returns An array of strings containing the categories
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    getCats(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            let results = await this.methodCall("get_cats");

            if( !results.categories )
                reject(new Error("Invalid response from SABnzbd"));
            else
                resolve(results.categories);
        });
    }

    /**
     * Get all scripts
     * @returns An array of strings containing the scripts
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    getScripts(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            let results = await this.methodCall("get_scripts");
            if( !results.scripts )
                reject(new Error("Invalid response from SABnzbd"));
            else
                resolve(results.scripts);
        });
    }

    /**
     * Return download statistics in bytes, total and per-server.
     * @returns {@link Stats} containing all the statistic information
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
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

    /**
     * You can read the whole configuration, a sub-set or a single setting.
     * @param section - Section of the config item
     * @param keyword - The config item
     * @returns Config item in JSON object
     * @throw {Error} throws error if unable to reach SABnzbd server or an invalid response
     */
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

    /**
     * Set configuration option
     * @param args JSON object with fields section, keyword, and value
     * @returns JSON object with new config options if set
     */
    setConfig(args: any): Promise<any> {
        return new Promise<any>(async resolve => {
            let results = await this.methodCall("set_config", args);
            resolve(results);
        });
    }

    /**
     * Reset config item to default value
     * @param keyword 
     * @returns 
     */
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
