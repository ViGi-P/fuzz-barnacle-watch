export interface WatchResponse {
	watch: string;
	warning?: string;
}

export interface FileData {
	name: string;
	size: number;
	mtime_ms: number;
	exists: boolean;
	type: "d" | "f";
}

export interface SubscriptionResponse {
	subscription: string;
	files: FileData[];
	is_fresh_instance: boolean;
}
