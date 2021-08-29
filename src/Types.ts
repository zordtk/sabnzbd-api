
// SABnzbd-API
//   https://github.com/zordtk/sabnzbd-api
//   Written By Jeremy Harmon <jeremy.harmon@zoho.com>

export enum ErrorType {
    Warning
}

export interface ErrorWarning {
    text: string,
    type: ErrorType,
    time: number
}

export interface ServerStats {
    week: number;
    total: number;
    day: number;
    month: number;
    daily: Map<string, number>;
    articles_tried: Map<string, number>;
    articles_success: Map<string, number>;
}

export interface Stats {
  day: number;
  week: number;
  month: number;
  total: number;
  servers: Map<string, ServerStats>;
}

export interface History {
    noofslots: number;
    day_size: string;
    week_size: string;
    month_size: string;
    total_size: string;
    last_history_update: number;
    slots: HistorySlots[];
}

export interface HistorySlots {
    action_line: string;
    series: string;
    script_log: string;
    meta?: null;
    fail_message: string;
    loaded: boolean;
    id: number;
    size: string;
    category: string;
    pp: string;
    retry: number;
    script: string;
    nzb_name: string;
    download_time: number;
    storage: string;
    has_rating: boolean;
    status: string;
    script_line: string;
    completed: number;
    nzo_id: string;
    downloaded: number;
    report: string;
    password: string;
    path: string;
    postproc_time: number;
    name: string;
    url: string;
    md5sum: string;
    bytes: number;
    url_info: string;
    stage_log?: (HistoryStageLog)[];
}

export interface HistoryStageLog {
    name: string;
    actions?: (string)[] | null;
}

export interface Queue {
    status: string;
    speedlimit: string;
    speedlimit_abs: string;
    paused: boolean;
    noofslots_total: number;
    noofslots: number;
    limit: number;
    start: number;
    eta: string;
    timeleft: string;
    speed: string;
    kbpersec: string;
    size: string;
    sizeleft: string;
    mb: string;
    mbleft: string;
    slots: (QueueSlot)[];
    categories?: (string)[] | null;
    scripts?: (string)[] | null;
    diskspace1: string;
    diskspace2: string;
    diskspacetotal1: string;
    diskspacetotal2: string;
    diskspace1_norm: string;
    diskspace2_norm: string;
    rating_enable: boolean;
    have_warnings: string;
    pause_int: string;
    loadavg: string;
    left_quota: string;
    refresh_rate: string;
    version: string;
    finish: number;
    cache_art: string;
    cache_size: string;
    cache_max: string;
    finishaction?: null;
    paused_all: boolean;
    quota: string;
    have_quota: boolean;
    queue_details: string;
}

export interface QueueSlot {
    status: string;
    index: number;
    password: string;
    avg_age: string;
    script: string;
    has_rating: boolean;
    mb: string;
    mbleft: string;
    mbmissing: string;
    size: string;
    sizeleft: string;
    filename: string;
    labels?: (string | null)[] | null;
    priority: string;
    cat: string;
    eta: string;
    timeleft: string;
    percentage: string;
    nzo_id: string;
    unpackopts: string;
}

export enum CompleteAction {
    HibernatePC = "hibernate_pc",
    StandbyPC = "standby_pc",
    ShutdownProgram = "shutdown_program"
}

export enum SortOptions {
    AverageAge = "avg_age",
    Name = "name",
    Size = "size",
}

export enum Priority {
    Default = -100,
    Stop = -4,
    Duplicate = -3,
    Paused = -2,
    Low = -1,
    Normal = 0,
    High = 1,
    Force = 2
}

export enum PostProcessing {
    Default = -1,
    None = 0,
    Repair = 1,
    RepairUnpack = 2,
    RepairUnpackDelete = 3
}

export interface File {
    status: string;
    mbleft: string;
    mb: string;
    age: string;
    bytes: string;
    filename: string;
    nzf_id: string;
    set?: string | null;
}
  
export interface Results {
    status: boolean,
    error?: string,
    priority?: Priority,
    position?: number,
    nzo_ids?: string[]
}