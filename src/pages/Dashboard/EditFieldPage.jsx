import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext";
import { toast } from "react-toastify";
import { AvailabilityService } from "../../services/AvailabilityService";
import { Camera, Trash2, Plus, Pencil } from "lucide-react";

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

const EditFieldPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fields, updateField, uploadMultipleFieldImages, deleteFieldImage } = useDashboard();
  const [fieldImages, setFieldImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [replacingImageUrl, setReplacingImageUrl] = useState(null);
  const fileInputRef = React.useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    location: "",
    price: "",
    description: "",
    hours: "",
    image: "",
  });

  // Availability schedule state
  const [schedule, setSchedule] = useState(
    DAYS.map((d) => ({
      day_of_week: d.value,
      label: d.label,
      enabled: false,
      start_time: "08:00",
      end_time: "00:00",
    })),
  );

  const [isLoading, setIsLoading] = useState(false);

  const updateScheduleDay = (index, field, value) => {
    setSchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Initialize form with existing data
  useEffect(() => {
    const fieldToEdit = fields.find(
      (f) => f.id === parseInt(id) || f.id === id,
    );
    if (fieldToEdit) {
      let priceValue = fieldToEdit.price;
      if (typeof fieldToEdit.price === "string") {
        priceValue = fieldToEdit.price.replace(/[^0-9]/g, "");
      }

      setFormData({
        ...fieldToEdit,
        price: priceValue,
      });

      // Set images from field data
      if (fieldToEdit.field_images) {
        setFieldImages(fieldToEdit.field_images);
      } else if (
        fieldToEdit.image &&
        !fieldToEdit.image.includes("placehold.co")
      ) {
        setFieldImages([{ url_image: fieldToEdit.image }]);
      }

      // Fetch existing availability
      const fetchAvailability = async () => {
        try {
          const availabilities = await AvailabilityService.getFieldAvailability(
            fieldToEdit.id,
          );
          setSchedule((prev) =>
            prev.map((day) => {
              const found = availabilities.find(
                (a) => a.day_of_week === day.day_of_week,
              );
              if (found) {
                return {
                  ...day,
                  enabled: true,
                  start_time: found.start_time.substring(0, 5),
                  end_time: found.end_time.substring(0, 5),
                };
              }
              return { ...day, enabled: false };
            }),
          );
        } catch (error) {
          console.error("Erreur chargement disponibilités:", error);
        }
      };

      fetchAvailability();
    } else if (fields.length > 0) {
      toast.error("Terrain non trouvé");
      navigate("/dashboard/terrains");
    }
  }, [id, fields, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.name || !formData.price || !formData.location) {
      toast.error("Veuillez remplir les champs obligatoires");
      setIsLoading(false);
      return;
    }

    const enabledDays = schedule.filter((d) => d.enabled);
    if (enabledDays.length === 0) {
      toast.error("Veuillez activer au moins un jour de disponibilité.");
      setIsLoading(false);
      return;
    }

    try {
      // Générer un résumé des horaires
      let hoursSummary = "Fermé";
      if (enabledDays.length > 0) {
        hoursSummary = `${enabledDays[0].start_time} - ${enabledDays[0].end_time}`;
      }

      const updatedField = {
        ...formData,
        hours: hoursSummary,
        price: `${formData.price} CFA/h`,
        skipImageUpdate: true, // Don't let updateField overwrite our gallery
      };

      await updateField(id, updatedField);

      // Update availabilities
      const availabilities = enabledDays.map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
      }));

      await AvailabilityService.setFieldAvailability(id, availabilities);

      toast.success("Terrain modifié avec succès !");
      navigate("/dashboard/terrains");
    } catch (error) {
      console.error("Erreur modification:", error);
      toast.error("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };




  const handleReplaceImageTrigger = (imageUrl) => {
    setReplacingImageUrl(imageUrl);
    fileInputRef.current?.click();
  };

  const handleAddImage = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      if (replacingImageUrl) {
        // Replacement Logic
        await deleteFieldImage(id, replacingImageUrl);
        const urls = await uploadMultipleFieldImages(id, files);
        const newImages = urls.map((url) => ({ url_image: url }));

        setFieldImages((prev) => {
          const index = prev.findIndex(
            (img) => img.url_image === replacingImageUrl,
          );
          if (index === -1) return [...prev, ...newImages];
          const updated = [...prev];
          updated.splice(index, 1, ...newImages);
          return updated;
        });

        toast.success("Image remplacée !");
      } else {
        // Normal Add Logic
        const urls = await uploadMultipleFieldImages(id, files);
        const newImages = urls.map((url) => ({ url_image: url }));
        setFieldImages((prev) => [...prev, ...newImages]);
        toast.success(
          files.length > 1
            ? `${files.length} images ajoutées !`
            : "Image ajoutée !",
        );
      }
    } catch (error) {
      toast.error(
        replacingImageUrl
          ? "Erreur lors du remplacement"
          : "Erreur lors de l'ajout des images",
      );
    } finally {
      setIsUploadingImage(false);
      setReplacingImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!window.confirm("Supprimer cette image ?")) return;

    try {
      await deleteFieldImage(id, imageUrl);
      setFieldImages((prev) => prev.filter((img) => img.url_image !== imageUrl));
      toast.success("Image supprimée !");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const inputClasses =
    "w-full px-4 py-3.5 rounded-xl border border-[#493622] bg-[#1a1208] text-white placeholder-[#8c735d] shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";
  const labelClasses = "text-white text-sm font-bold mb-1.5 block opacity-90";

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-3xl mx-auto w-full pb-20 px-0 sm:px-4">
      <h2 className="text-white text-2xl md:text-3xl font-black italic tracking-tight px-4 sm:px-0">Modifier le Terrain</h2>

      <div className="bg-[#2c241b] rounded-3xl border border-[#493622] p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-6">
          <div className="group">
            <label htmlFor="name" className={labelClasses}>
              Nom du terrain <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ex: Terrain Almadies 2"
              value={formData.name}
              onChange={handleInputChange}
              className={inputClasses}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="group">
              <label htmlFor="type" className={labelClasses}>
                Type de terrain <span className="text-primary">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={inputClasses}
              >
                <option value="">Choisir...</option>
                <option value="5 vs 5 • Gazon synthétique">
                  5 vs 5 • Gazon synthétique
                </option>
                <option value="7 vs 7 • Gazon synthétique">
                  7 vs 7 • Gazon synthétique
                </option>
                <option value="5 vs 5 • Gazon naturel">
                  5 vs 5 • Gazon naturel
                </option>
                <option value="7 vs 7 • Gazon naturel">
                  7 vs 7 • Gazon naturel
                </option>
              </select>
            </div>

            <div className="group">
              <label htmlFor="price" className={labelClasses}>
                Prix / Heure (CFA) <span className="text-primary">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                placeholder="Ex: 25000"
                value={formData.price}
                onChange={handleInputChange}
                className={inputClasses}
                required
              />
            </div>
          </div>

          <div className="group">
            <label htmlFor="location" className={labelClasses}>
              Adresse / Localisation <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="Ex: Mermoz, Pyrotechnie"
              value={formData.location}
              onChange={handleInputChange}
              className={inputClasses}
              required
            />
          </div>

          <div className="group">
            <label htmlFor="description" className={labelClasses}>
              Description du terrain
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="Description du terrain, commodités..."
              value={formData.description}
              onChange={handleInputChange}
              className={inputClasses}
            />
          </div>

          {/* ═══ SECTION GALERIE PHOTOS ═══ */}
          <div className="border-t border-[#493622] pt-6">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-white text-lg font-black mb-1">
                  📸 Galerie Photos
                </h3>
                <p className="text-[#cbad90] text-xs italic">
                  Gérez les photos du terrain (Sélection multiple).
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {isUploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Ajouter des photos</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAddImage}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {fieldImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-video rounded-xl overflow-hidden border border-[#493622] bg-[#1a1208]"
                >
                  <img
                    src={img.url_image}
                    alt={`Terrain ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => handleReplaceImageTrigger(img.url_image)}
                      className="bg-primary text-[#231a10] p-2 rounded-full hover:scale-110 active:scale-90 transition-all shadow-lg"
                      title="Modifier/Remplacer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.url_image)}
                      className="bg-red-600 text-white p-2 rounded-full hover:scale-110 active:scale-90 transition-all shadow-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {fieldImages.length === 0 && !isUploadingImage && (
                <div className="col-span-full py-10 flex flex-col items-center justify-center border border-dashed border-[#493622] rounded-2xl bg-[#1a1208]/30">
                  <Camera className="w-10 h-10 text-[#5d452b] mb-2" />
                  <p className="text-[#cbad90] text-sm italic">
                    Aucune photo dans la galerie
                  </p>
                </div>
              )}
              {isUploadingImage && (
                <div className="aspect-video rounded-xl border border-dashed border-primary bg-primary/5 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ SECTION DISPONIBILITÉS ═══ */}
          <div className="border-t border-[#493622] pt-6">
            <h3 className="text-white text-lg font-black mb-1">
              📅 Disponibilités
            </h3>
            <p className="text-[#cbad90] text-xs mb-6 italic">
              Définissez les jours et heures d'ouverture du terrain.
            </p>

            <div className="space-y-3">
              {schedule.map((day, index) => (
                <div
                  key={day.day_of_week}
                  className={`flex flex-col xs:flex-row xs:items-center gap-3 p-3 rounded-2xl border transition-all ${
                    day.enabled
                      ? "bg-[#231a10] border-primary/40"
                      : "bg-[#231a10]/50 border-[#493622]/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between xs:justify-start gap-4">
                    <div className="flex items-center justify-center shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateScheduleDay(index, "enabled", !day.enabled)
                        }
                        className={`w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#231a10] ${
                          day.enabled ? "bg-primary" : "bg-[#493622]"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                            day.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <span
                      className={`text-sm font-bold xs:w-20 shrink-0 ${
                        day.enabled ? "text-white" : "text-[#5d452b]"
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>

                  {day.enabled && (
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <input
                        type="time"
                        value={day.start_time}
                        onChange={(e) =>
                          updateScheduleDay(index, "start_time", e.target.value)
                        }
                        className="px-3 py-2 rounded-xl bg-[#1a1208] text-white text-sm border border-[#493622] focus:border-primary focus:outline-none flex-1 xs:flex-none xs:w-24 text-center font-bold [color-scheme:dark]"
                      />
                      <span className="text-primary text-xs font-black">→</span>
                      <input
                        type="time"
                        value={day.end_time}
                        onChange={(e) =>
                          updateScheduleDay(index, "end_time", e.target.value)
                        }
                        className="px-3 py-2 rounded-xl bg-[#1a1208] text-white text-sm border border-[#493622] focus:border-primary focus:outline-none flex-1 xs:flex-none xs:w-24 text-center font-bold [color-scheme:dark]"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-[#493622]">
            <button
              type="button"
              onClick={() => navigate("/dashboard/terrains")}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#493622] text-[#cbad90] hover:bg-[#493622] transition-colors font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-primary text-[#231a10] px-8 py-3 rounded-xl font-black hover:shadow-[0_0_20px_rgba(242,127,13,0.5)] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="size-4 border-2 border-[#231a10]/30 border-t-[#231a10] rounded-full animate-spin"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFieldPage;
