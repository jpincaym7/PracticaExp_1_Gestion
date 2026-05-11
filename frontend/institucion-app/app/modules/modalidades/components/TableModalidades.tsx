"use client";

import React, { useEffect, useState } from "react";
import DataTable, { type DataTableColumn, type DataTableAction } from "@/shared/components/Datatable";
import DeleteConfirm from "@/shared/components/DeleteConfirm";
import FormModalidades from "./forms/FormModalidades";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import type { Modalidad } from "@/shared/types/modalidad";
import { modalidadService } from "@/modules/modalidades/services/modalidad.service";
import { formatApiErrors } from "@/shared/core/api";
import { Button } from "@/shared/components/ui/button";
import Loading from "@/shared/components/ui/loading";
import { useToast } from "@/shared/components/toast";

export default function TableModalidades() {
  const toast = useToast();
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<'activos' | 'inactivos'>('activos');

  const [showForm, setShowForm] = useState(false);
  const [modalidadToEdit, setModalidadToEdit] = useState<Modalidad | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modalidadToDelete, setModalidadToDelete] = useState<Modalidad | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false);
  const [modalidadToHardDelete, setModalidadToHardDelete] = useState<Modalidad | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);

  useEffect(() => {
    loadModalidades();
  }, [estadoFiltro]);

  const loadModalidades = async () => {
    try {
      setIsLoading(true);
      const response = estadoFiltro === 'activos'
        ? await modalidadService.list()
        : await modalidadService.listInactivas();
      setModalidades(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las modalidades.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setModalidadToEdit(null);
    setShowForm(true);
  };

  const handleEdit = (modalidad: Modalidad) => {
    setModalidadToEdit(modalidad);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setModalidadToEdit(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    loadModalidades();
  };

  const handleDeleteClick = (modalidad: Modalidad) => {
    setModalidadToDelete(modalidad);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!modalidadToDelete) return;

    setIsDeleting(true);
    try {
      await modalidadService.delete(modalidadToDelete.id);
      toast.success(`Modalidad "${modalidadToDelete.nombre}" eliminada exitosamente`);
      setShowDeleteConfirm(false);
      setModalidadToDelete(null);
      loadModalidades();
    } catch (error) {
      toast.error(formatApiErrors(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (modalidad: Modalidad) => {
    try {
      await modalidadService.restore(modalidad.id);
      toast.success(`Modalidad "${modalidad.nombre}" restaurada exitosamente`);
      loadModalidades();
    } catch (error) {
      toast.error("Error al restaurar la modalidad.");
    }
  };

  const handleHardDeleteClick = (modalidad: Modalidad) => {
    setModalidadToHardDelete(modalidad);
    setShowHardDeleteConfirm(true);
  };

  const handleConfirmHardDelete = async () => {
    if (!modalidadToHardDelete) return;

    setIsHardDeleting(true);
    try {
      await modalidadService.hardDelete(modalidadToHardDelete.id);
      toast.success(`Modalidad "${modalidadToHardDelete.nombre}" eliminada permanentemente`);
      setShowHardDeleteConfirm(false);
      setModalidadToHardDelete(null);
      loadModalidades();
    } catch (error) {
      toast.error(formatApiErrors(error));
    } finally {
      setIsHardDeleting(false);
    }
  };

  const columns: DataTableColumn<Modalidad>[] = [
    { key: "nombre", header: "Nombre", sortable: true, searchable: true, className: "font-semibold" },
    { key: "created_at", header: "Fecha de Creación", render: (v) => new Date(v as string).toLocaleDateString("es-ES") },
    {
      key: "estado",
      header: "Estado",
      render: (v) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${v ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {v ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const actions: DataTableAction<Modalidad>[] = estadoFiltro === 'activos'
    ? [
        { label: "Editar", onClick: handleEdit, variant: "outline" },
        { label: "Eliminar", onClick: handleDeleteClick, variant: "destructive" },
      ]
    : [
        { label: "Restaurar", onClick: handleRestore, variant: "outline" },
        { label: "Eliminar Permanentemente", onClick: handleHardDeleteClick, variant: "destructive" },
      ];

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loading size="lg" message="Cargando modalidades..." /></div>;

  return (
    <>
      <div className="space-y-4">
        <DataTable
          data={modalidades}
          columns={columns}
          actions={actions}
          keyExtractor={(row) => row.id}
          searchable
          searchPlaceholder="Buscar por nombre..."
          searchKeys={["nombre"]}
          pagination
          itemsPerPage={10}
          pageSizeOptions={[5, 10, 20, 50]}
          defaultSortKey="nombre"
          defaultSortOrder="asc"
          emptyMessage="No hay modalidades registradas"
          showCard
          headerActions={<Button onClick={handleCreate}>+ Nueva Modalidad</Button>}
          additionalFilters={
            <>
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
            </>
          }
        />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalidadToEdit ? "Editar Modalidad" : "Nueva Modalidad"}</DialogTitle>
            <DialogDescription>
              {modalidadToEdit ? "Modifica los datos de la modalidad" : "Complete los datos para crear una nueva modalidad"}
            </DialogDescription>
          </DialogHeader>
          <FormModalidades
            modalidadId={modalidadToEdit?.id}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar modalidad?"
        itemName={modalidadToDelete ? `la modalidad "${modalidadToDelete.nombre}"` : "esta modalidad"}
        description="Esta acción no se puede deshacer. La modalidad será marcada como inactiva."
        isDeleting={isDeleting}
      />

      <DeleteConfirm
        open={showHardDeleteConfirm}
        onOpenChange={setShowHardDeleteConfirm}
        onConfirm={handleConfirmHardDelete}
        title="¿Eliminar permanentemente?"
        itemName={modalidadToHardDelete ? `la modalidad "${modalidadToHardDelete.nombre}"` : "esta modalidad"}
        description="ADVERTENCIA: Esta acción es IRREVERSIBLE. La modalidad será eliminada permanentemente de la base de datos y no se podrá recuperar."
        isDeleting={isHardDeleting}
      />
    </>
  );
}
