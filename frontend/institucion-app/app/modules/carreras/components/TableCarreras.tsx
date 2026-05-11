"use client";

import React, { useEffect, useState } from "react";
import DataTable, { type DataTableColumn, type DataTableAction } from "@/shared/components/Datatable";
import DeleteConfirm from "@/shared/components/DeleteConfirm";
import FormCarreras from "./forms/FormCarreras";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import type { Carrera } from "@/shared/types/carrera";
import type { Modalidad } from "@/shared/types/modalidad";
import { carreraService } from "@/modules/carreras/services/carrera.service";
import { modalidadService } from "@/modules/modalidades/services/modalidad.service";
import { formatApiErrors } from "@/shared/core/api";
import { Button } from "@/shared/components/ui/button";
import Loading from "@/shared/components/ui/loading";
import { useToast } from "@/shared/components/toast";

interface TableCarrerasProps {
  onView?: (carrera: Carrera) => void;
}

export default function TableCarreras({ onView }: TableCarrerasProps) {
  const toast = useToast();
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<'activos' | 'inactivos'>('activos');
  const [modalidadFiltro, setModalidadFiltro] = useState<string>('todas');
  const [showForm, setShowForm] = useState(false);
  const [carreraToEdit, setCarreraToEdit] = useState<Carrera | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; item: Carrera | null; type: 'soft' | 'hard' }>({
    show: false,
    item: null,
    type: 'soft'
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const loadModalidades = async () => {
    try {
      const response = await modalidadService.list();
      setModalidades(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadCarreras = async () => {
    try {
      setIsLoading(true);
      const params = modalidadFiltro !== 'todas' ? { modalidad: parseInt(modalidadFiltro) } : {};
      const response = estadoFiltro === 'activos' 
        ? await carreraService.list(params) 
        : await carreraService.listInactivas(params);
      setCarreras(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las carreras.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModalidades();
  }, []);

  useEffect(() => {
    loadCarreras();
  }, [estadoFiltro, modalidadFiltro]);

  const handleCreate = () => {
    setCarreraToEdit(null);
    setShowForm(true);
  };

  const handleEdit = (carrera: Carrera) => {
    setCarreraToEdit(carrera);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setCarreraToEdit(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    loadCarreras();
  };

  const handleDeleteClick = (carrera: Carrera, type: 'soft' | 'hard') => {
    setDeleteConfirm({ show: true, item: carrera, type });
  };

  const handleConfirmDelete = async () => {
    const { item, type } = deleteConfirm;
    if (!item) return;

    setIsDeleting(true);
    try {
      type === 'soft' 
        ? await carreraService.delete(item.id)
        : await carreraService.hardDelete(item.id);
        
      toast.success(`Carrera "${item.nombre}" eliminada ${type === 'hard' ? 'permanentemente' : 'exitosamente'}`);
      setDeleteConfirm({ ...deleteConfirm, show: false });
      loadCarreras();
    } catch (error) {
      toast.error(formatApiErrors(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (carrera: Carrera) => {
    try {
      await carreraService.restore(carrera.id);
      toast.success(`Carrera "${carrera.nombre}" restaurada exitosamente`);
      loadCarreras();
    } catch (error) {
      toast.error("Error al restaurar la carrera.");
    }
  };

  const columns: DataTableColumn<Carrera>[] = [
    { key: "nombre", header: "Nombre", sortable: true, searchable: true, className: "font-semibold" },
    { key: "modalidad_nombre", header: "Modalidad", searchable: true, render: (v) => <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{v}</span> },
    { key: "created_at", header: "Fecha de Creación", render: (v) => new Date(v as string).toLocaleDateString("es-ES") },
    { key: "estado", header: "Estado", render: (v) => <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${v ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{v ? "Activo" : "Inactivo"}</span> },
  ];

  const actions: DataTableAction<Carrera>[] = estadoFiltro === 'activos'
    ? [
        { label: "Editar", onClick: handleEdit, variant: "outline" },
        { label: "Eliminar", onClick: (row) => handleDeleteClick(row, 'soft'), variant: "destructive" },
      ]
    : [
        { label: "Restaurar", onClick: handleRestore, variant: "outline" },
        { label: "Eliminar Permanentemente", onClick: (row) => handleDeleteClick(row, 'hard'), variant: "destructive" },
      ];

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loading size="lg" message="Cargando carreras..." /></div>;

  return (
    <>
      <DataTable
        data={carreras}
        columns={columns}
        actions={actions}
        keyExtractor={(row) => row.id}
        searchable
        searchPlaceholder="Buscar por nombre o modalidad..."
        searchKeys={["nombre", "modalidad_nombre"]}
        pagination
        itemsPerPage={10}
        pageSizeOptions={[5, 10, 20, 50]}
        defaultSortKey="nombre"
        defaultSortOrder="asc"
        emptyMessage="No hay carreras registradas"
        showCard
        headerActions={<Button onClick={handleCreate}>+ Nueva Carrera</Button>}
        additionalFilters={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="estado-filter" className="text-sm font-medium text-gray-700">Estado:</label>
              <select
                id="estado-filter"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value as 'activos' | 'inactivos')}
                className="border-input h-9 rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="modalidad-filter" className="text-sm font-medium text-gray-700">Modalidad:</label>
              <select
                id="modalidad-filter"
                value={modalidadFiltro}
                onChange={(e) => setModalidadFiltro(e.target.value)}
                className="border-input h-9 rounded-md border bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas</option>
                {modalidades.map(mod => <option key={mod.id} value={mod.id}>{mod.nombre}</option>)}
              </select>
            </div>
          </div>
        }
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{carreraToEdit ? "Editar Carrera" : "Nueva Carrera"}</DialogTitle>
            <DialogDescription>
              {carreraToEdit ? "Modifica los datos de la carrera" : "Complete los datos para crear una nueva carrera"}
            </DialogDescription>
          </DialogHeader>
          <FormCarreras carreraId={carreraToEdit?.id} onSuccess={handleFormSuccess} onCancel={handleCloseForm} />
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={deleteConfirm.show}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, show: open }))}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.type === 'hard' ? "¿Eliminar permanentemente?" : "¿Eliminar carrera?"}
        itemName={deleteConfirm.item ? `la carrera "${deleteConfirm.item.nombre}"` : "esta carrera"}
        description={deleteConfirm.type === 'hard' ? "ADVERTENCIA: Esta acción es IRREVERSIBLE." : "La carrera será marcada como inactiva."}
        isDeleting={isDeleting}
      />
    </>
  );
}
