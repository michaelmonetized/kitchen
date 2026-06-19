export type BlameLine = {
    lineNumber: number;
    text: string;
    authorUserId: string;
    authorLabel: string;
    versionId: string;
    timestamp: number;
};
export type VersionSnapshot = {
    _id: string;
    _creationTime: number;
    authorUserId: string;
    authorLabel: string;
    content: string;
};
export declare function computeBlame(versions: VersionSnapshot[]): BlameLine[];