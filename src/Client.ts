// SABnzbd-API
//   https://github.com/zordtk/sabnzbd-api
//   Written By Jeremy Harmon <jeremy.harmon@zoho.com>

import got from "got";
import {Stats,ErrorType,ErrorWarning,ServerStats,Queue,QueueSlot,CompleteAction,SortOptions,Priority,PostProcessing,File,Results,History,HistorySlots,HistoryStageLog,Status} from "./Types";
import FormData = require("form-data");

/**
 * The {@link https://sabnzbd.org|SABnzbd} API Client.
 */
export class Client {
    /**
     * The hostname of the SABnzbd server including protocol (HTTP/HTTPS)
     * @private
     */
    private mHost: string;

    /**
     * The API key for the SABnzbd server
     * @private
     */
    private mApiKey: string;

    /**
     * Create new API client connecting to the given host using the supplied apiKey.
     * 
     * @example
     * ```javascript
     * const sabnzbd    = require("sabnzbd-api");
     * let client       = new sabnzbd.Client("https://host.com/sabnzbd", "apikey");
     * ```
     * 
     * If your host requires HTTP authentication you can pass it in the host param
     * @example
     * ```javascript
     * const sabnzbd    = require("sabnzbd-api");
     * let client       = new sabnzbd.Client("https://user:password@host.com/sabnzbd", "apikey");
     * ```
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
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server
     */
    queue(start?: number, limit?: number, search?: string, nzoIds?: string[]): Promise<Queue> {
        return new Promise<Queue>(async (resolve, reject) => {
            try {
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
                resolve(<Queue>resultsObj.queue);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Pauses the whole queue
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    queuePause(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("pause");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Resume the whole queue
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    queueResume(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("resume");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Sort the queue by {@link SortOptions.AverageAge}, {@link SortOptions.Name} or {@link SortOptions.Size} in Ascending or Descending order.
     * @param sortBy - The option to sort queue by
     * @param ascending - Ascending or false for Descending order
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    queueSort(sortBy: SortOptions, ascending: boolean): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("queue", {name: "sort", "dir": (ascending ? "asc" : "desc"), sort: sortBy});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Remove all jobs from the queue, or only the ones matching search. Returns nzb_id of the jobs removed.
     * @param search - Filter jobs by search term
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    queuePurge(search?: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let searchParams = new URLSearchParams();
                searchParams.append("name", "purge");
                searchParams.append("del_files", "1");
                if( search ) searchParams.append("search", search);

                let results: Results = await this.methodCall("queue", searchParams);
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Sets the speedlimit to value in percentage of the maximum line speed (set by user).
     * @param value The speed limit value in either percentage. It can also be followed by K,M to define speedlimit in KB/s,MB/s, respectively.
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    queueSpeedLimit(value: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("config", {name: "speedlimit", value: value});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Set an end-of-queue action
     * @param action - Either one of {@link CompleteAction} or a string contaning the name of a script to execute. Prefix the script name
     * with script_ example: script_process.py
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changeCompleteAction(action: CompleteAction|string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("change_complete_action", {value: action});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
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
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    addUrl(url: string, name?: string, password?: string, cat?: string, script?: string, priority?: Priority, postProcess?: PostProcessing): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
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
            } catch( error ) {
                reject(error);
            }
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
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    addPath(filePath: string, name?: string, password?: string, cat?: string, script?: string, priority?: Priority, postProcess?: PostProcessing): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
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
            } catch( error ) {
                reject(error);
            }
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
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    addFile(formData: FormData, name?: string, password?: string, cat?: string, script?: string, priority?: Priority, postProcess?: PostProcessing): Promise<Results> {
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

            got.post(`${this.mHost}/api`, {body: formData}).then(response => {
                if( response.statusCode === 200 ) {
                    try {
                        let resultObject: Results = JSON.parse(response.body);
                        resolve(resultObject);
                    } catch( error ) {
                        reject(new Error('Error parsing response as JSON'));
                    }
                }
            }).catch(error => {
                if( error instanceof Error )
                    reject(new Error(`Error accessing SABnzbd host: ${error.message}`));
                else
                    reject(new Error('Error accessing SABnzbd host'));
            });
        });
    }

    /**
     * Pause a single job based on its nzo_id. Returns list of affected nzo_ids.
     * @param id - The nzo_id of the Job to pause
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobPause(id: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("queue", {name: "pause", value: id});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Resumes a single job based on its nzo_id. Returns list of affected nzo_ids.
     * @param id - The nzo_id of the Job to resume 
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobResume(id: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("queue", {name: "resume", value: id});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Delets jobs based on its nzo_id. Returns list of affected nzo_ids.
     * @param id - Either a string containing one nzo_id or a array of nzo_ids
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobDelete(id: string|string[]): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                if( id instanceof Array ) {
                    let results: Results = await this.methodCall("queue", {name: "delete", value: id.join(",")});
                    resolve(results);
                } else {
                    let results: Results = await this.methodCall("queue", {name: "delete", value: id});
                    resolve(results);
                }
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Delete all jobs
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobDeleteAll(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try  {
                let results: Results = await this.methodCall("queue", {name: "delete", value: "all", del_files: 1});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Job's can be switched by providing 2 nzo_id, firstId is the item you want to move, secondId is the id of the job where 
     * you want to put value one above, shifting job secondId down.
     * @param firstId - nzo_id of job to move
     * @param secondId - nzo_id of where you want to put the job, shifting this job down.
     * @returns 
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobMove(firstId: string, secondId: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("switch", {value: firstId, value2: secondId});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Change name and optionally the password of job with nzo_id.
     * @param id - nzo_id of the Job
     * @param newName - New name for the job
     * @param password - Optional password to be used during unpacking
     * @returns {@link Results.Status} set to true or false if the call was successful
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    jobChangeName(id: string, newName: string, password?: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let searchParams = new URLSearchParams();
                searchParams.append("name", "rename");
                searchParams.append("value", id);
                searchParams.append("value2", newName);
                if( password ) searchParams.append("value3", password);

                let results: Results = await this.methodCall("queue", searchParams);
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Change category of job with nzo_id. List of available categories can be retrieved from {@link getCats}.
     * @param id - The nzo_id of the Job to change
     * @param category - The name of the category
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changeCat(id: string, category: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("change_cat", {value: id, value2: category});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Change script of job with nzo_id. List of available scripts can be retrieved from {@link getScripts}.
     * @param id - The nzo_id of the Job to change
     * @param script - The script name
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changeScript(id: string, script: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("change_script", {value: id, value2: script});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Change priority of job.
     * @param id - The nzo_id of the Job to change
     * @param priority - The priority
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changePriority(id: string, priority: Priority): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("queue", {name: priority, value: id, value2: priority});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Change post-processing of job.
     * @param id - The nzo_id of the Job to change
     * @param postProcessing - The PostProcessing level
     * @returns {@link Results} containing the status and affected nzo_ids.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    changePostProcessing(id: string, postProcessing: PostProcessing): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("change_opts", {value: id, value2: postProcessing});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Get files of job
     * @param id - The nzo_id of the Job
     * @returns Any array of {@link File}
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    getFiles(id: string): Promise<File[]> {
        return new Promise<File[]>(async (resolve, reject) => {
            try{
                let results = await this.methodCall("get_files", {value: id});
                resolve(<File[]>results.files);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Full history output with details about all jobs. The queue and the history output share many common fields, but the history also contains 
     * statistiscs about how much has been downloaded in the past day, week, month and total.
     * @category History
     * @param start - Index of job to start at
     * @param limit - Number of jobs to display
     * @param category - Only return jobs in this category
     * @param search - Filter job names by search term
     * @param nzoIds - Filter jobs by nzo_ids
     * @param failedOnly - Only show failed jobs
     * @param lastHistoryUpdate Only return full output if anything has changed since lastHistoryUpdate, the last update is given by a previous call to history
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     * @returns The history
     */
    history(start?: number, limit?: number, category?: string, search?: string, nzoIds?: string[], failedOnly?: boolean, lastHistoryUpdate?: boolean): Promise<History> {
        return new Promise<History>(async (resolve, reject) => {
            try {
                let searchParams = new URLSearchParams();
                if( start )             searchParams.append("start", start.toString());
                if( limit )             searchParams.append("limit", limit.toString());
                if( category )          searchParams.append("category", category);
                if( search )            searchParams.append("search", search);
                if( nzoIds )            searchParams.append("nzo_ids", nzoIds.join(','));
                if( failedOnly )        searchParams.append("failed_only", (failedOnly ? '1':'0'));
                if( lastHistoryUpdate ) searchParams.append("last_history_update", (lastHistoryUpdate ? '1':'0'));

                let resultsObj          = await this.methodCall("history", searchParams);
                let results: History    = resultsObj.history;
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Retry history item(s) based on nzo_id Optionally provide a password for unpacking.
     * @category History
     * @param id - nzo_id of the history item
     * @param password - Password for unpacking
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    historyRetry(id: string, password?: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try{
                let searchParams = new URLSearchParams();
                searchParams.append("value", id);
                if( password ) searchParams.append("password", password);
                
                let results: Results = await this.methodCall("retry", searchParams);
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Will retry all failed jobs in the history. However, you are not able to supply passwords or extra NZB's.
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    historyRetryAll(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try{ 
                let results: Results = await this.methodCall("retry_all");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Retry history item(s) based on nzo_id and an additional NZB set to the nzbfile field. 
     * Optionally provide a password for unpacking.
     * @category History
     * @param id - nzo_id of the history item
     * @param formData - New NZB to upload
     * @param password - Password for unpacking
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    historyRetryWithNZB(id: string, formData: FormData, password?: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            formData.append("mode", "retry");
            formData.append("output", "json");
            formData.append("apikey", this.mApiKey);
            formData.append("value", id);
            formData.append("nzbfile", formData);
            if( password ) formData.append("password", password);
            
            got.post(`${this.mHost}/api`, {body: formData}).then(response => {
                if( response.statusCode === 200 ) {
                    try {
                        let resultObject: Results = JSON.parse(response.body);
                        resolve(resultObject);
                    } catch( error ) {
                        reject(new Error('Error parsing response as JSON'));
                    }
                }
            }).catch(error => {
                if( error instanceof Error )
                    reject(new Error(`Error accessing SABnzbd host: ${error.message}`));
                else
                    reject(new Error('Error accessing SABnzbd host'));
            });
        });
    }

    /**
     * Delete history items(s) based on nzo_id
     * @category History
     * @param id - nzo_id of the item(s) to delete
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    historyDelete(id: string|string[]): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let ids = id;
                if( id instanceof Array )
                    ids = id.join(',');
                let results: Results = await this.methodCall("history", {name: "delete", value: ids});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Delete all history items(s)
     * @category History
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
     historyDeleteAll(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("history", {name: "delete", value: 'all'});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Delete all failed history items(s)
     * @category History
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
     historyDeleteAllFailed(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("history", {name: "delete", value: 'failed'});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Get version of running SABnzbd
     * @category Misc
     * @returns String containing the version information
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    version(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("version");
                if( results.version )
                    resolve(results.version);
                else
                    reject(new Error("Invalid response from SABnzbd"));
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Get authentication methods available for interaction with the API
     * @category Misc
     * @returns An array of auth methods
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    auth(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("auth");
                if( results.auth )
                    resolve(results.auth);
                else
                    reject(new Error("Invalid response from SABnzbd"));
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Get all active warnings
     * @category Misc
     * @returns An array of {@link ErrorWarning} describing all warnings.
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    warnings(): Promise<ErrorWarning[]> {
        return new Promise<ErrorWarning[]>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("warnings");
                let warnings: ErrorWarning[] = [];

                for( let result of results ) {
                    if( !result.text || result.type !== "WARNING" || !result.time )
                        reject(new Error("Invalid response from SABnzbd"));
                    warnings.push({text: result.text, type: ErrorType.Warning, time: result.time});    
                }

                resolve(warnings);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Clear all active warnings
     * @category Misc
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    warningsClear(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("warnings", {name: "clear"});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Get all categories
     * @category Misc
     * @returns An array of strings containing the categories
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    getCats(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("get_cats");

                if( !results.categories )
                    reject(new Error("Invalid response from SABnzbd"));
                else
                    resolve(results.categories);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Get all scripts
     * @category Misc
     * @returns An array of strings containing the scripts
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    getScripts(): Promise<string[]> {
        return new Promise<string[]>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("get_scripts");
                if( !results.scripts )
                    reject(new Error("Invalid response from SABnzbd"));
                else
                    resolve(results.scripts);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Return download statistics in bytes, total and per-server.
     * @category Stats
     * @returns {@link Stats} containing all the statistic information
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    serverStats(): Promise<Stats> {
        return new Promise<Stats>(async (resolve, reject) => {
            try {
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
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * You can read the whole configuration, a sub-set or a single setting.
     * @category Config
     * @param section - Section of the config item
     * @param keyword - The config item
     * @returns Config item in JSON object
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    getConfig(section?: string, keyword?: string): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                let options: any    = {};
                if( section )
                    options.section = section;
                if( keyword )
                    options.keyword = keyword;

                let serverConfig = await this.methodCall("get_config", options);
                resolve(serverConfig);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Set configuration option
     * @category Config
     * @param args JSON object with fields section, keyword, and value
     * @returns JSON object with new config options if set
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    setConfig(args: any): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("set_config", args);
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Reset config item to default value
     * @category Config
     * @param keyword 
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    setConfigDefault(keyword: string|string[]): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
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
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Translate any text known to SABnzbd from English to the locale setting of the user.
     * @category Misc
     * @param text - The text to translate
     * @returns The translated text
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    translateText(text: string): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("translate", {value: text});
                if( results.value )
                    resolve(results.value);
                else
                    reject(new Error('Error in API call' + (results.error ? `: ${results.error}` : '')));
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Shutdown SABnzbd
     * @category Misc
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    shutdown(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("shutdown");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Restart SABnzbd
     * @category Misc
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    restart(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("restart");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Restart SABnzbd and perform a queue repair 
     * @category Misc
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    restartRepair(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("restart_repair");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Pause post-processing queue
     * @category Misc
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    pausePostProcessing(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("pause_pp");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Fetch and process all RSS feeds
     * @category Misc
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    rssNow(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("rss_now");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Scan Watched Folder now
     * @category Misc
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    watchedNow(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("watched_now");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Reset the user defined quota to 0
     * @category Misc
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    resetQuota(): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("reset_quota");
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Get all status information available from SABnzbd.
     * @param skipDashboard Skip detecting public IPv4 address which can take some time.
     * @param calculatePerformance Calculate performance measures
     * @returns {@link Status} 
     */
    status(skipDashboard: Boolean = false, calculatePerformance: Boolean = false): Promise<Status> {
        return new Promise<Status>(async (resolve, reject) => {
            try {
                let results = await this.methodCall("status", { "skip_dashboard": skipDashboard, "calculate_performance": calculatePerformance});
                let status: Status = results['status'];
                resolve(status);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Unblock server based on servername from the status.
     * @param name Name of the server to unblock
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    statusUnblockServer(name: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let results: Results = await this.methodCall("status", {"name": "unblock_server", value: name});
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Delete orphaned job based on the folder name from the status. 
     * @param folder Name of the folder
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    statusDeleteOrphaned(folder: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let searchParams = new URLSearchParams();
                searchParams.append("name", "delete_orphan");
                searchParams.append("value", folder);

                let results: Results = await this.methodCall("status", searchParams);
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Retry orphaned job based on the folder name from the status. 
     * @param folder Name of the folder
     * @returns {@link Results} containing the status
     * @throw {@link https://nodejs.org/api/errors.html#errors_class_error|Error} throws error if unable to reach SABnzbd server or an invalid response
     */
    statusRetryOrphaned(folder: string): Promise<Results> {
        return new Promise<Results>(async (resolve, reject) => {
            try {
                let searchParams = new URLSearchParams();
                searchParams.append("name", "add_orphan");
                searchParams.append("value", folder);

                let results: Results = await this.methodCall("status", searchParams);
                resolve(results);
            } catch( error ) {
                reject(error);
            }
        });
    }

    /**
     * Call method on SABnzbd server and parse results as a JSON object if output
     * is json.
     * @private
     * @param method - The api method to call
     * @param args - Either a JSON object or a URLSearchParams object containing the arguments
     * @param output - Output type either json or text
     * @returns JSON object or string containing text depending on output
     */
    private methodCall(method: string, args?: URLSearchParams|any, output: string = 'json'): Promise<any> {
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
        });
    }
}
