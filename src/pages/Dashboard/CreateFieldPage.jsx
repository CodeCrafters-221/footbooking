import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../context/DashboardContext';
import { toast } from 'react-toastify';
import { AvailabilityService } from '../../services/AvailabilityService';
import { Camera, Plus, Trash2 } from "lucide-react";
import { uploadTerrainImage } from "../../services/TerrainService";

const DAYS = [
    { value: 1, label: "Lundi" },
    { value: 2, label: "Mardi" },
    { value: 3, label: "Mercredi" },
    { value: 4, label: "Jeudi" },
    { value: 5, label: "Vendredi" },
    { value: 6, label: "Samedi" },
    { value: 0, label: "Dimanche" },
];

const CreateFieldPage = () => {
    const navigate = useNavigate();
    const { addField } = useDashboard();

    const [formData, setFormData] = useState({
        name: "",
        type: "",
        location: "",
        price: "",
        description: "",
        hours: "08:00 - 00:00",
        images: []
    });

    // Availability schedule state
    const [schedule, setSchedule] = useState(
        DAYS.map(d => ({
            day_of_week: d.value,
            label: d.label,
            enabled: d.value >= 1 && d.value <= 6, // Lundi-Samedi par défaut
            start_time: "08:00",
            end_time: "00:00",
        }))
    );

    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleImageChange = async (e) => {
        try {
            setUploading(true);
            const files = Array.from(e.target.files);
            if (!files || files.length === 0) return;

            const uploadedUrls = [];
            for (const file of files) {
                const url = await uploadTerrainImage(file);
                uploadedUrls.push(url);
            }

            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), ...uploadedUrls]
            }));
            toast.success(`${uploadedUrls.length} image(s) ajoutée(s) !`);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Erreur lors de l'envoi des images");
        } finally {
            setUploading(false);
            if (e.target) e.target.value = null;
        }
    };

    const removeImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const updateScheduleDay = (index, field, value) => {
        setSchedule(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

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

        const enabledDays = schedule.filter(d => d.enabled);
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

            const newFieldData = {
                ...formData,
                hours: hoursSummary,
                price: formData.price,
                status: "Disponible"
            };

            const createdField = await addField(newFieldData);

            if (createdField?.id) {
                const availabilities = enabledDays.map(d => ({
                    day_of_week: d.day_of_week,
                    start_time: d.start_time,
                    end_time: d.end_time,
                }));

                await AvailabilityService.setFieldAvailability(createdField.id, availabilities);
            }

            toast.success("Terrain créé avec ses disponibilités !");
            navigate('/dashboard/terrains');
        } catch (error) {
            console.error("Erreur création:", error);
            toast.error(error.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-3.5 rounded-xl border border-[#493622] bg-[#1a1208] text-white placeholder-[#8c735d] shadow-inner focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";
    const labelClasses = "text-white text-sm font-bold mb-1.5 block opacity-90";

    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-3xl mx-auto w-full pb-20 px-0 sm:px-4">
            <h2 className="text-white text-2xl md:text-3xl font-black italic tracking-tight px-4 sm:px-0">
                Ajouter un Nouveau Terrain
            </h2>

            <div className="bg-[#2c241b] rounded-3xl border border-[#493622] p-4 sm:p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-6">
                    <div className="group">
                        <label htmlFor="name" className={labelClasses}>Nom du terrain <span className="text-primary">*</span></label>
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
                            <label htmlFor="type" className={labelClasses}>Type de terrain <span className="text-primary">*</span></label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className={inputClasses}
                            >
                                <option value="">Choisir...</option>
                                <option value="5 vs 5 • Gazon synthétique">5 vs 5 • Gazon synthétique</option>
                                <option value="7 vs 7 • Gazon synthétique">7 vs 7 • Gazon synthétique</option>
                                <option value="5 vs 5 • Gazon naturel">5 vs 5 • Gazon naturel</option>
                                <option value="7 vs 7 • Gazon naturel">7 vs 7 • Gazon naturel</option>
                            </select>
                        </div>

                        <div className="group">
                            <label htmlFor="price" className={labelClasses}>Prix / Heure (CFA) <span className="text-primary">*</span></label>
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
                        <label htmlFor="location" className={labelClasses}>Adresse / Localisation <span className="text-primary">*</span></label>
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

                    {/* ═══ SECTION GALERIE PHOTOS ═══ */}
                    <div className="border-t border-[#493622] pt-6">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-white text-lg font-black mb-1">📸 Galerie Photos</h3>
                                <p className="text-[#cbad90] text-xs italic">Gérez les photos du terrain (Sélection multiple possible).</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                <span>Ajouter des photos</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                            {formData.images && formData.images.map((url, idx) => (
                                <div
                                    key={idx}
                                    className="relative group aspect-video rounded-xl overflow-hidden border border-[#493622] bg-[#1a1208]"
                                >
                                    <img
                                        src={url}
                                        alt={`Terrain ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="bg-red-600 text-white p-2 rounded-full hover:scale-110 active:scale-90 transition-all shadow-lg"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!formData.images || formData.images.length === 0) && !uploading && (
                                <div className="col-span-full py-10 flex flex-col items-center justify-center border border-dashed border-[#493622] rounded-2xl bg-[#1a1208]/30">
                                    <Camera className="w-10 h-10 text-[#5d452b] mb-2" />
                                    <p className="text-[#cbad90] text-sm italic">Aucune photo dans la galerie</p>
                                </div>
                            )}
                            {uploading && (
                                <div className="aspect-video rounded-xl border border-dashed border-primary bg-primary/5 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="group">
                        <label htmlFor="description" className={labelClasses}>Description du terrain</label>
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

                    {/* ═══ SECTION DISPONIBILITÉS ═══ */}
                    <div className="border-t border-[#493622] pt-6">
                        <h3 className="text-white text-lg font-black mb-1">📅 Disponibilités</h3>
                        <p className="text-[#cbad90] text-xs mb-6 italic">Définissez les jours et heures d'ouverture du terrain.</p>

                        <div className="space-y-3">
                            {schedule.map((day, index) => (
                                <div
                                    key={day.day_of_week}
                                    className={`flex flex-col xs:flex-row xs:items-center gap-3 p-3 rounded-2xl border transition-all ${day.enabled
                                        ? "bg-[#231a10] border-primary/40"
                                        : "bg-[#231a10]/50 border-[#493622]/50 opacity-60"
                                        }`}
                                >
                                    <div className="flex items-center justify-between xs:justify-start gap-4">
                                        <div className="flex items-center justify-center shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => updateScheduleDay(index, 'enabled', !day.enabled)}
                                                className={`w-11 h-6 rounded-full relative transition-colors duration-300 ease-in-out flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#231a10] ${day.enabled ? 'bg-primary' : 'bg-[#493622]'
                                                    }`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${day.enabled ? 'translate-x-5' : 'translate-x-0'
                                                    }`} />
                                            </button>
                                        </div>

                                        <span className={`text-sm font-bold xs:w-20 shrink-0 ${day.enabled ? 'text-white' : 'text-[#5d452b]'
                                            }`}>
                                            {day.label}
                                        </span>
                                    </div>

                                    {day.enabled && (
                                        <div className="flex items-center gap-2 flex-1 justify-end">
                                            <input
                                                type="time"
                                                value={day.start_time}
                                                onChange={(e) => updateScheduleDay(index, 'start_time', e.target.value)}
                                                className="px-3 py-2 rounded-xl bg-[#1a1208] text-white text-sm border border-[#493622] focus:border-primary focus:outline-none flex-1 xs:flex-none xs:w-24 text-center font-bold [color-scheme:dark]"
                                            />
                                            <span className="text-primary text-xs font-black">→</span>
                                            <input
                                                type="time"
                                                value={day.end_time}
                                                onChange={(e) => updateScheduleDay(index, 'end_time', e.target.value)}
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
                            onClick={() => navigate('/dashboard/terrains')}
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
                                    Enregistrement...
                                </>
                            ) : "Créer le Terrain"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFieldPage;

