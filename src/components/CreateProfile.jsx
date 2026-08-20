import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function CreateProfile() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    ville: "",
    role: "",
  });
  const [avatar, setAvatar] = useState(null);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Effacer l'erreur du champ en cours de modification
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};

    if (formData.name == "") {
      validationErrors.name = "Le champ nom est requis !";
    }

    if (!formData.role) {
      validationErrors.role = "Veuillez choisir un role !";
    }

    if (formData.ville == "") {
      validationErrors.ville = "Le champ ville est requis !";
    }

    const phoneRegex = /^(221|00221|\+221)?(77|78|75|70|76)[0-9]{7}$/;
    if (formData.phone == "") {
      validationErrors.phone = "Le téléphone est requis";
    } else if (!phoneRegex.test(formData.phone)) {
      validationErrors.phone = "Format numéro invalide";
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsLoading(true);

      let avatarUrl = null;

      if (avatar) {
        const ext = avatar.name.split(".").pop();
        const filePath = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatar, {
            upsert: true,
            contentType: avatar.type,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = data.publicUrl;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        name: formData.name,
        phone: formData.phone,
        ville: formData.ville,
        image: avatarUrl,
        role: formData.role,
      }, { onConflict: "id" });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Profil créé !");
      await refreshProfile();
      if (formData.role == "client") {
        navigate("/");
      } else if (formData.role == "owner") {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur serveur, réessaie plus tard");
    } finally {
      setIsLoading(false);
    }
  };

  // Classes communes pour les inputs pour garder le code propre
  const inputClasses = `w-full px-4 py-3 rounded-lg border bg-transparent text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors`;

  return (
    <div className="bg-[#2e2318] rounded-2xl w-xl shadow-2xl border border-surface-highlight">
      <div className="p-6 sm:p-8">
        <h2 className="text-white text-2xl font-semibold text-center mb-6">
          Création de Profil
        </h2>

        <form onSubmit={handleSubmit} method="POST" className="space-y-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-text-secondary text-sm">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${inputClasses} ${errors.name ? "border-red-500" : "border-surface-highlight"}`}
            />
            {errors.name && (
              <span className="text-red-500 text-xs">{errors.name}</span>
            )}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-text-secondary text-sm">
              Phone
            </label>
            <input
              type="number"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`${inputClasses} ${errors.phone ? "border-red-500" : "border-surface-highlight"}`}
            />
            {errors.phone && (
              <span className="text-red-500 text-xs">{errors.phone}</span>
            )}
          </div>

          {/* Ville */}
          <div className="flex flex-col gap-1">
            <label htmlFor="ville" className="text-text-secondary text-sm">
              Ville
            </label>
            <div className="relative">
              <input
                type="text"
                id="ville"
                name="ville"
                value={formData.ville}
                onChange={handleInputChange}
                className={`${inputClasses} ${errors.ville ? "border-red-500" : "border-surface-highlight"}`}
              />
            </div>
            {errors.ville && (
              <span className="text-red-500 text-xs">{errors.ville}</span>
            )}
          </div>

          {/* Image */}
          <div className="flex flex-col gap-1">
            <label htmlFor="image" className="text-text-secondary text-sm">
              Image
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                id="image"
                name="image"
                onChange={(e) => setAvatar(e.target.files[0])}
                className={`${inputClasses} ${errors.image ? "border-red-500" : "border-surface-highlight"}`}
              />
            </div>
            {errors.image && (
              <span className="text-red-500 text-xs">{errors.image}</span>
            )}
          </div>

          {/* Role (client ou proprietaire) */}
          <div className="flex flex-col gap-1">
            <label className="text-text-secondary text-sm">
              Êtes-vous un propriétaire ou un client ?
            </label>

            <div className="flex items-center gap-6">
              {/* CLIENT */}
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === "client"}
                  onChange={handleInputChange}
                  className="accent-cyan-400"
                />
                Client
              </label>

              {/* PROPRIETAIRE */}
              <label className="flex items-center gap-2 cursor-pointer text-white">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={formData.role === "owner"}
                  onChange={handleInputChange}
                  className="accent-cyan-400"
                />
                Propriétaire
              </label>
            </div>

            {errors.role && (
              <span className="text-red-500 text-xs">{errors.role}</span>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-black font-semibold py-3 rounded-lg hover:bg-primary/90 transition-opacity mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Création..." : "Créer mon profil"}
          </button>
        </form>
      </div>
    </div>
  );
}
