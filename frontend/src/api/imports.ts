import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export type ImportSourceType = "EXCEL" | "CSV";

export interface ImportPreview {
    headers: string[];
    sampleRows: Record<string, unknown>[];
    totalRows: number;
}

export interface StockItemMapping {
    sku: string;
    name: string;
    unit: string;
    unitCost: string;
    quantityOnHand?: string;
}

export interface ImportRowError { 
    row: number;
    message: string;
}

export interface ImportResult {
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: ImportRowError[];
}

export interface SavedMapping {
    mapping: StockItemMapping;
}

export function getSourceTypeFromFileName(fileName: string): ImportSourceType {
    return fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'EXCEL';
}

export function usePreviewImport() {
    return useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return apiClient.postForm<ImportPreview>('/imports/stock-items/preview', formData)
        },
    });
}

export function useCommitImport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({file, mapping}: {file: File; mapping: StockItemMapping }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mapping', JSON.stringify(mapping));
            return apiClient.postForm<ImportResult>('/imports/stock-items/commit', formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockItems'] });
        },
    });
}

export function useSavedMapping(sourceType: ImportSourceType | null) {
    return useQuery({
        queryKey: ['importMapping', sourceType],
        queryFn: () => 
            apiClient.get<SavedMapping | null>(`/imports/stock-items/mapping?sourceType=${sourceType}`),
        enabled: !!sourceType,
    });
}