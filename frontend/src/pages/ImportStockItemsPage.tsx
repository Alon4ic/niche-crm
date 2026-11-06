import { useState } from "react";
import {
  Card,
  Container,
  FileInput,
  Loader,
  Title,
  Text,
  Stack,
  Group,
  Select,
  Table,
  Button,
} from "@mantine/core";
import {
  usePreviewImport,
  useCommitImport,
  useSavedMapping,
  getSourceTypeFromFileName,
  type ImportPreview,
  type StockItemMapping,
} from "../api/imports";
import { useTranslation } from "react-i18next";

const REQUIRED_FIELDS: {
  key: keyof StockItemMapping;
  matchLabel: string;
  translationKey: string;
  required: boolean;
}[] = [
  {
    key: "sku",
    matchLabel: "SKU",
    translationKey: "stockItems.sku",
    required: true,
  },
  {
    key: "name",
    matchLabel: "Name",
    translationKey: "common.name",
    required: true,
  },
  {
    key: "unit",
    matchLabel: "Unit",
    translationKey: "stockItems.unit",
    required: true,
  },
  {
    key: "unitCost",
    matchLabel: "Unit cost",
    translationKey: "stockItems.unitCost",
    required: true,
  },
  {
    key: "quantityOnHand",
    matchLabel: "Quantity on hand",
    translationKey: "stockItems.quantityOnHand",
    required: false,
  },
];

function guessMapping(headers: string[]): Partial<Record<string, string>> {
  const guess: Partial<Record<string, string>> = {};
  for (const field of REQUIRED_FIELDS) {
    const match = headers.find(
      (h) => h.toLowerCase().trim() === field.matchLabel.toLowerCase(),
    );
    if (match) guess[field.key] = match;
  }
  return guess;
}

export function ImportStockItemsPage() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});

  const previewImport = usePreviewImport();
  const commitImport = useCommitImport();

  const sourceType = file ? getSourceTypeFromFileName(file.name) : null;
  const { data: savedMapping } = useSavedMapping(sourceType);

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setPreview(null);
    commitImport.reset();

    if (!selectedFile) return;

    const result = await previewImport.mutateAsync(selectedFile);
    setPreview(result);

    if (savedMapping?.mapping) {
      setMapping(savedMapping.mapping as unknown as Record<string, string>);
    } else {
      setMapping(guessMapping(result.headers) as Record<string, string | null>);
    }
  };

  const handleMappingChange = (field: string, value: string | null) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const isMappingComplete = REQUIRED_FIELDS.filter((f) => f.required).every(
    (f) => mapping[f.key],
  );

  const handleCommit = async () => {
    if (!file || !isMappingComplete) return;
    await commitImport.mutateAsync({
      file,
      mapping: mapping as unknown as StockItemMapping,
    });
  };

  return (
    <Container mt="xl">
      <Title order={2} mb="lg">
        {t("imports.title")}
      </Title>

      <Card withBorder mb="lg">
        <FileInput
          label={t("imports.fileLabel")}
          placeholder={t("imports.filePlaceholder")}
          accept=".csv,.xlsx,.xls"
          value={file}
          onChange={handleFileChange}
          clearable
        />
      </Card>

      {previewImport.isPending && <Loader mt="md" />}

      {preview && (
        <Card withBorder mb="lg">
          <Title order={4} mb="sm">
            {t("imports.mapColumns")}
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            {t('imports.rowsFound', {count: preview.totalRows})}
          </Text>

          <Stack mb="lg">
            {REQUIRED_FIELDS.map((field) => (
              <Group key={field.key} justify="space-between">
                <Text size="sm" fw={500} w={160}>
                  {t(field.translationKey)}
                  {field.required && " *"}
                </Text>
                <Select
                  placeholder={t('imports.selectColumn')}
                  data={preview.headers}
                  value={mapping[field.key] ?? null}
                  onChange={(value) => handleMappingChange(field.key, value)}
                  clearable={!field.required}
                  style={{ flex: 1 }}
                />
              </Group>
            ))}
          </Stack>

          <Title order={5} mb="xs">
            {t('imports.preview')}
          </Title>
          <Table striped mb="lg" style={{ overflowX: "auto" }}>
            <Table.Thead>
              <Table.Tr>
                {preview.headers.map((h) => (
                  <Table.Th key={h}>{h}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {preview.sampleRows.map((row, i) => (
                <Table.Tr key={i}>
                  {preview.headers.map((h) => (
                    <Table.Td key={h}>{String(row[h] ?? "")}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Button
            onClick={handleCommit}
            loading={commitImport.isPending}
            disabled={!isMappingComplete}
          >
            {t('imports.importRows', { count: preview.totalRows })}
          </Button>
        </Card>
      )}
    </Container>
  );
}
