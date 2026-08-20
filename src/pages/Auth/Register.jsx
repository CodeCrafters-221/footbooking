import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { getPlatformSettings } from "../../services/adminService";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Effacer l'erreur du champ en cours de modification
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      validationErrors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email)) {
      validationErrors.email = "Format d'email invalide";
    }

    if (!formData.password) {
      validationErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      validationErrors.password = "6 caractères minimum";
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsLoading(true);

      const settings = await getPlatformSettings();
      if (!settings.allow_new_registrations) {
        toast.error("Les inscriptions sont temporairement fermées.");
        setIsLoading(false);
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          toast.info("Un compte existe déjà avec cet email. Connectez-vous !");
          navigate("/login");
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      // If signUp is successful and auto-login is on (default), user might already be in session
      // However, we navigate to create-profile to ensure they complete their data
      toast.success("Compte créé avec succès !");
      navigate("/create-profile");

    }
    catch (err) {
      console.error(err);
      toast.error("Erreur serveur, réessaie plus tard");
    }
    finally {
      setIsLoading(false);
    }

  };


  const inputClasses = `w-full px-4 py-3 rounded-xl border bg-background-dark text-white placeholder-text-secondary/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors`;

  return (
    <div className="bg-[#2e2318] rounded-2xl w-xl shadow-2xl border border-surface-highlight">
      <div className="p-6 sm:p-8">
        <h2 className="text-white text-2xl font-semibold text-center mb-6">
          S'inscrire
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-text-secondary text-sm">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`${inputClasses} ${errors.email ? "border-red-500 ring-red-500 focus:ring-red-500" : "border-surface-highlight"}`}
            />
            {errors.email && (
              <span className="text-red-500 text-xs">{errors.email}</span>
            )}
          </div>

          {/* Mot de passe */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-text-secondary text-sm">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`${inputClasses} ${errors.password ? "border-red-500 ring-red-500 focus:ring-red-500" : "border-surface-highlight"}`}
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-text-secondary text-sm hover:text-white"
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </div>
            {errors.password && (
              <span className="text-red-500 text-xs">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-black font-semibold py-3 rounded-lg hover:bg-primary/90 transition-opacity mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Inscription..." : "S'inscrire"}
          </button>

          <p className="text-white text-center">
            Deja un compte ? <Link to="/login" className="text-primary">Se Connecter !</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
