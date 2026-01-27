import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import type { DataTablePageEvent } from "primereact/datatable";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string | null;
  date_start: number | null;
  date_end: number | null;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    current_page: number;
    total_pages: number;
  };
}

export default function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(12);
  const [page, setPage] = useState(1);

  // selection persistence
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deselectedIds, setDeselectedIds] = useState<Set<number>>(new Set());

  // custom selection overlay
  const overlayRef = useRef<OverlayPanel>(null);
  const [selectCount, setSelectCount] = useState<number | null>(null);

  useEffect(() => {
    loadPage(page);
  }, [page, rows]);

  const loadPage = async (pageNo: number) => {
    setLoading(true);

    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${pageNo}&limit=${rows}`
      );
      const result: ApiResponse = await response.json();

      setArtworks(result.data);
      setTotalRecords(result.pagination.total);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (e: DataTablePageEvent) => {
    setFirst(e.first);
    setRows(e.rows);
    setPage(e.page! + 1);
  };

  const selectedRows = artworks.filter(
    row => selectedIds.has(row.id) && !deselectedIds.has(row.id)
  );

  const handleSelectionChange = (e: { value: Artwork[] }) => {
    const pageRowIds = artworks.map(row => row.id);

    const updatedSelected = new Set(selectedIds);
    const updatedDeselected = new Set(deselectedIds);

    pageRowIds.forEach(id => updatedDeselected.add(id));

    e.value.forEach(row => {
      updatedSelected.add(row.id);
      updatedDeselected.delete(row.id);
    });

    setSelectedIds(updatedSelected);
    setDeselectedIds(updatedDeselected);
  };

  const applyCustomSelection = () => {
    if (!selectCount || selectCount <= 0) return;

    const updatedSelected = new Set(selectedIds);
    const updatedDeselected = new Set(deselectedIds);

    artworks.slice(0, selectCount).forEach(row => {
      updatedSelected.add(row.id);
      updatedDeselected.delete(row.id);
    });

    setSelectedIds(updatedSelected);
    setDeselectedIds(updatedDeselected);

    overlayRef.current?.hide();
    setSelectCount(null);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-2">
        <span>
          Selected: {selectedIds.size - deselectedIds.size} rows
        </span>

        <Button
          label="Custom Select"
          icon="pi pi-check-square"
          onClick={(e) => overlayRef.current?.toggle(e)}
        />
      </div>

      <DataTable
        value={artworks}
        paginator
        lazy
        loading={loading}
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPage={handlePageChange}
        selection={selectedRows}
        onSelectionChange={handleSelectionChange}
        dataKey="id"
      >
        <Column selectionMode="multiple" style={{ width: "3rem" }} />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>

      <OverlayPanel ref={overlayRef}>
        <div className="flex gap-2 items-center">
          <InputNumber
            value={selectCount}
            onValueChange={(e) => setSelectCount(e.value)}
            placeholder="Rows"
          />
          <Button label="Apply" onClick={applyCustomSelection} />
        </div>
      </OverlayPanel>
    </div>
  );
}
