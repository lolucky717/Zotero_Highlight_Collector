import { VocabRecord } from "./vocabListener";

export interface RecordQuery {
    categorySlug?: string;
    sourceStates?: VocabRecord["sourceState"][];
    offset?: number;
    limit?: number;
}

export interface RecordPage {
    records: VocabRecord[];
    total: number;
}

export interface RecordRepository {
    list(query?: RecordQuery): RecordPage;
    getAll(): VocabRecord[];
    upsert(records: VocabRecord[]): VocabRecord[];
    updateSourceState(
        annotationIDs: number[],
        state: VocabRecord["sourceState"],
    ): number;
}