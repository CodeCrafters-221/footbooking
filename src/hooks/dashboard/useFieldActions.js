import { useCallback } from "react";
import { TerrainService } from "../../services/TerrainService";

export const useFieldActions = (dispatch, refreshData) => {
  const addField = useCallback(
    async (formData, imageFile) => {
      await TerrainService.createTerrain(formData, imageFile);
      await refreshData();
      return true;
    },
    [refreshData],
  );

  const updateField = useCallback(
    async (id, formData, imageFile) => {
      await TerrainService.updateTerrain(id, formData, imageFile);
      await refreshData();
      return true;
    },
    [refreshData],
  );

  const deleteField = useCallback(
    async (id) => {
      await TerrainService.deleteTerrain(id);
      dispatch({ type: "DELETE_FIELD", payload: id });
    },
    [dispatch],
  );

  return { addField, updateField, deleteField };
};
