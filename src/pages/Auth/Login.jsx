import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router";

export default function Login() {
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

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      validationErrors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email)) {
      validationErrors.email = "Format d'email invalide";
    }

    if (!formData.password)
      validationErrors.password = "Le mot de passe est requis";
    if (formData.password.length < 6 && formData.password)
      validationErrors.password = "6 caractères minimum";

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsLoading(true);

      // Connecter l'user
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Vérifier si le profil existe et récupérer le rôle
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      toast.success("Ravi de vous revoir 😀 !");

      if (!profileData) {
        // Rediriger vers la création de profil si inexistant
        navigate("/create-profile");
      } else {
        // Redirection basée sur le rôle
        if (profileData.role === "super_admin") {
          navigate("/admin");
        } else if (profileData.role === "owner") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de la connexion.");
    } finally {
      setIsLoading(false);
    }

  };

  // Classes communes pour les inputs pour garder le code propre
  const inputClasses = `w-full px-4 py-3 rounded-lg border bg-transparent text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors`;

  return (
    <div className="bg-[#2e2318] rounded-2xl w-xl shadow-2xl border border-surface-highlight relative">
      <div className="p-6 sm:p-8">
        <h2 className="text-white text-2xl font-semibold text-center mb-6">
          Se Connecter
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
              className={`${inputClasses} ${errors.email ? "border-red-500" : "border-[#493622]"}`}
            />
            {errors.email && (
              <span className="text-red-500 text-xs">{errors.email}</span>
            )}
          </div>

          {/* Mot de passe */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-[#cbad90] text-sm">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`${inputClasses} ${errors.password ? "border-red-500" : "border-[#493622]"}`}
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-[#cbad90] text-sm hover:text-white"
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
            {isLoading ? "Connexion..." : "Se Connecter"}
          </button>

          <p className="text-white text-center">
            Pas de compte ? <Link to="/register" className="text-primary">Créer un compte !</Link>
          </p>
        </form>

      </div>
    </div>
  );
}