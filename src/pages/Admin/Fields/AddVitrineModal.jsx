import { useState } from "react";
import { X, Upload } from "lucide-react";
import { createVitrineField } from "../../../services/adminService";
import { toast } from "react-toastify";

export default function AddVitrineModal({ isOpen, onClose, onFieldAdded }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    adress: "",
    telephone: "",
    description: "",
    price_per_hour: "",
    pelouse: "Synthétique",
    capacity: "10"
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.adress) {
      toast.error("Veuillez remplir les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      await createVitrineField(formData, imageFile);
      toast.success("Terrain vitrine ajouté avec succès !");
      onFieldAdded();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création du terrain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#2c241b] border border-[#493622] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#2c241b] border-b border-[#493622] p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Ajouter un Terrain Vitrine</h2>
            <p className="text-sm text-[#cbad90] mt-1">Ce terrain sera affiché pour attirer les joueurs, mais géré par l'administration.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#493622] rounded-xl text-gray-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-[#cbad90] text-sm font-medium mb-2">Image du terrain</label>
            <div className="flex items-center gap-6">
              <div 
                className="w-32 h-32 rounded-xl bg-[#231a10] border-2 border-dashed border-[#493622] flex flex-col items-center justify-center text-gray-500 overflow-hidden relative cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('vitrine-image-upload').click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-xs">Ajouter photo</span>
                  </>
                )}
                <input 
                  id="vitrine-image-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </div>
              <div className="flex-1 text-sm text-gray-400">
                Une belle image aide à attirer plus de joueurs sur la plateforme.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[#cbad90] text-sm font-medium mb-2">Nom du terrain *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Ex: Complexe Sportif de Dakar"
              />
            </div>
            <div>
              <label className="block text-[#cbad90] text-sm font-medium mb-2">Adresse / Localisation *</label>
              <input
                type="text"
                name="adress"
                value={formData.adress}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Ex: Almadies, Dakar"
              />
            </div>
            <div>
              <label className="block text-[#cbad90] text-sm font-medium mb-2">Téléphone (WhatsApp/Contact)</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Ex: +221 77 000 00 00"
              />
            </div>
            <div>
              <label className="block text-[#cbad90] text-sm font-medium mb-2">Prix par heure (en CFA)</label>
              <input
                type="number"
                name="price_per_hour"
                value={formData.price_per_hour}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Ex: 15000"
              />
            </div>
            <div>
              <label className="block text-[#cbad90] text-sm font-medium mb-2">Type de pelouse</label>
              <select
                name="pelouse"
                value={formData.pelouse}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Synthétique">Synthétique</option>
                <option value="Naturel">Naturel</option>
                <option value="Indoor">Indoor (Futsal)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#cbad90] text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Description du terrain, équipements, horaires..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[#493622]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-white font-medium hover:bg-[#493622] transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-background-dark font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                "Ajouter le terrain"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
