import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ChevronLeft,
	Calendar,
	Clock,
	MapPin,
	User,
	Phone,
	Mail,
	Coins,
	CheckCircle,
	AlertCircle,
	Download,
	Edit3,
	Lock,
} from "lucide-react";
import { supabase } from "../../../services/supabaseClient";
import { logAdminAction } from "../../../services/adminService";
import { toast } from "react-toastify";
import ConfirmModalEnhanced from "../../../components/Admin/ConfirmModalEnhanced";

export default function BookingDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [booking, setBooking] = useState(null);
	const [loading, setLoading] = useState(true);
	const [actionHistory, setActionHistory] = useState([]);
	const [historyLoading, setHistoryLoading] =
		useState(false);
	const [confirmModal, setConfirmModal] = useState({
		open: false,
		action: null,
	});
	const [actionLoading, setActionLoading] = useState(false);

	useEffect(() => {
		fetchBookingDetail();
	}, [id]);

	const fetchBookingDetail = async () => {
		if (!id) return;
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from("reservations")
				.select(
					`
          id, date, start_time, end_time, status, total_price, payment_method,
          client_name, client_phone, user_id, created_at, updated_at,
          fields (id, name, adress, price_per_hour, pelouse)
        `,
				)
				.eq("id", id)
				.single();

			if (error) throw error;

			if (data.user_id) {
				const { data: profile } = await supabase
					.from("profiles")
					.select("id, name, phone")
					.eq("id", data.user_id)
					.maybeSingle();
				data.profiles = profile || null;
			}

			setBooking(data);
			await fetchActionHistory();
		} catch (err) {
			console.error("Erreur :", err);
			toast.error("Impossible de charger la réservation");
		} finally {
			setLoading(false);
		}
	};

	const fetchActionHistory = async () => {
		setHistoryLoading(true);
		try {
			const { data, error } = await supabase
				.from("admin_logs")
				.select(
					"id, action, details, created_at, profiles:admin_id(name)",
				)
				.eq("target_table", "reservations")
				.eq("target_id", id)
				.order("created_at", { ascending: false });

			if (error) throw error;
			setActionHistory(data || []);
		} catch (err) {
			console.error("Erreur historique :", err);
		} finally {
			setHistoryLoading(false);
		}
	};

	const handleAction = async (action, reason = "") => {
		if (!booking) return;

		setActionLoading(true);
		try {
			let newStatus = booking.status;

			if (action === "validate") {
				newStatus = "Confirmé";
			} else if (action === "cancel") {
				newStatus = "Annulé";
			} else if (action === "mark_paid") {
				newStatus = "Payé";
			}

			// Mettre à jour le statut
			const { error: updateError } = await supabase
				.from("reservations")
				.update({
					status: newStatus,
					updated_at: new Date().toISOString(),
				})
				.eq("id", booking.id);

			if (updateError) throw updateError;

			// Logger l'action admin
			await logAdminAction(
				`${action}_booking`,
				"reservations",
				booking.id,
				{
					reason,
					previous_status: booking.status,
					new_status: newStatus,
				},
			);

			// Mettre à jour l'état local
			setBooking({ ...booking, status: newStatus });
			setConfirmModal({ open: false, action: null });
			await fetchActionHistory();

			toast.success(
				action === "validate"
					? "Réservation validée ✓"
					: action === "cancel"
						? "Réservation annulée ✓"
						: "Réservation marquée comme payée ✓",
			);
		} catch (err) {
			console.error("Erreur action :", err);
			toast.error(err.message || "Erreur lors de l'action");
		} finally {
			setActionLoading(false);
		}
	};

	const canValidate = () =>
		booking &&
		booking.status !== "Confirmé" &&
		booking.status !== "Payé" &&
		booking.status !== "Annulé";

	const canCancel = () =>
		booking && booking.status !== "Annulé";

	const canMarkPaid = () =>
		booking && booking.status === "Confirmé";

	const getStatusColor = (status) => {
		if (status === "Payé" || status === "Confirmé")
			return "bg-green-500/10 text-green-400 border-green-500/20";
		if (status === "Annulé")
			return "bg-red-500/10 text-red-400 border-red-500/20";
		return "bg-orange-500/10 text-orange-400 border-orange-500/20";
	};

	if (loading) {
		return (
			<div className="p-6 space-y-6">
				<div className="h-8 w-32 bg-[#493622] rounded animate-pulse" />
				<div className="h-96 bg-[#493622] rounded-2xl animate-pulse" />
			</div>
		);
	}

	if (!booking) {
		return (
			<div className="p-6 text-center">
				<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
				<p className="text-white text-lg font-bold mb-2">
					Réservation introuvable
				</p>
				<button
					onClick={() => navigate("/admin/reservations")}
					className="text-primary hover:underline"
				>
					Retour aux réservations
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6 pb-12">
			{/* Breadcrumb */}
			<button
				onClick={() => navigate("/admin/reservations")}
				className="flex items-center gap-2 text-[#cbad90] hover:text-white font-medium text-sm"
			>
				<ChevronLeft className="w-4 h-4" />
				Retour aux réservations
			</button>

			{/* Header */}
			<div className="bg-[#2c241b] border border-[#493622] p-6 rounded-2xl space-y-4 shadow-xl">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-[#cbad90] text-xs font-bold uppercase tracking-wide mb-1">
							Réservation #{booking.id}
						</p>
						<h1 className="text-3xl font-black text-white">
							{booking.fields?.name}
						</h1>
						<p className="text-[#cbad90] text-sm mt-2 flex items-center gap-2">
							<MapPin className="w-4 h-4" />
							{booking.fields?.adress}
						</p>
					</div>
					<span
						className={`inline-flex px-4 py-2 rounded-lg text-sm font-bold border ${getStatusColor(booking.status)}`}
					>
						{booking.status}
					</span>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Colonne principale */}
				<div className="lg:col-span-2 space-y-6">
					{/* Informations Client */}
					<div className="bg-[#2c241b] border border-[#493622] p-6 rounded-2xl space-y-4">
						<h2 className="text-lg font-black text-white uppercase tracking-wide">
							Client
						</h2>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-[#cbad90] text-xs font-bold uppercase mb-1">
									Nom
								</p>
								<p className="text-white font-semibold flex items-center gap-2">
									<User className="w-4 h-4 text-primary" />
									{booking.client_name ||
										booking.profiles?.name ||
										"N/A"}
								</p>
							</div>
							<div>
								<p className="text-[#cbad90] text-xs font-bold uppercase mb-1">
									Rôle
								</p>
								<p className="text-white font-semibold">
									{booking.user_id
										? "Client App"
										: "Sur site"}
								</p>
							</div>
							<div>
								<p className="text-[#cbad90] text-xs font-bold uppercase mb-1">
									Téléphone
								</p>
								<p className="text-white font-semibold flex items-center gap-2">
									<Phone className="w-4 h-4 text-primary" />
									{booking.client_phone ||
										booking.profiles?.phone ||
										"N/A"}
								</p>
							</div>
							<div>
								<p className="text-[#cbad90] text-xs font-bold uppercase mb-1">
									Email
								</p>
								<p className="text-white font-semibold flex items-center gap-2 truncate">
									<Mail className="w-4 h-4 text-primary shrink-0" />
									{booking.user_id ? "Via compte client" : "N/A"}
								</p>
							</div>
						</div>
					</div>

					{/* Détails Réservation */}
					<div className="bg-[#2c241b] border border-[#493622] p-6 rounded-2xl space-y-4">
						<h2 className="text-lg font-black text-white uppercase tracking-wide">
							Détails Réservation
						</h2>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="lg:col-span-2 flex items-center gap-4 p-4 bg-[#1c1610] rounded-xl border border-[#493622]">
								<Calendar className="w-5 h-5 text-primary shrink-0" />
								<div>
									<p className="text-[#cbad90] text-xs font-bold uppercase">
										Date
									</p>
									<p className="text-white font-bold">
										{new Date(
											booking.date,
										).toLocaleDateString("fr-FR", {
											weekday: "long",
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 p-3 bg-[#1c1610] rounded-xl border border-[#493622]">
								<Clock className="w-5 h-5 text-primary shrink-0" />
								<div className="text-sm">
									<p className="text-[#cbad90] text-xs font-bold uppercase">
										Début
									</p>
									<p className="text-white font-bold">
										{booking.start_time?.substring(0, 5) ||
											booking.start_time}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 p-3 bg-[#1c1610] rounded-xl border border-[#493622]">
								<Clock className="w-5 h-5 text-primary shrink-0" />
								<div className="text-sm">
									<p className="text-[#cbad90] text-xs font-bold uppercase">
										Fin
									</p>
									<p className="text-white font-bold">
										{booking.end_time?.substring(0, 5) ||
											booking.end_time}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Paiement */}
					<div className="bg-[#2c241b] border border-[#493622] p-6 rounded-2xl space-y-4">
						<h2 className="text-lg font-black text-white uppercase tracking-wide">
							Paiement
						</h2>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/20 to-transparent rounded-xl border border-primary/30">
								<Coins className="w-5 h-5 text-primary shrink-0" />
								<div>
									<p className="text-[#cbad90] text-xs font-bold uppercase">
										Montant
									</p>
									<p className="text-white font-black text-lg">
										{(
											booking.total_price || 0
										).toLocaleString("fr-FR")}{" "}
										CFA
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 p-4 bg-[#1c1610] rounded-xl border border-[#493622]">
								<div className="w-5 h-5 text-primary shrink-0">
									💳
								</div>
								<div className="text-sm">
									<p className="text-[#cbad90] text-xs font-bold uppercase">
										Moyen
									</p>
									<p className="text-white font-bold">
										{booking.payment_method || "N/A"}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Historique des actions */}
					<div className="bg-[#2c241b] border border-[#493622] p-6 rounded-2xl space-y-4">
						<h2 className="text-lg font-black text-white uppercase tracking-wide">
							Historique des actions
						</h2>
						{historyLoading ? (
							<p className="text-[#cbad90] text-sm">
								Chargement...
							</p>
						) : actionHistory.length === 0 ? (
							<p className="text-[#cbad90] text-sm italic">
								Aucune action enregistrée
							</p>
						) : (
							<div className="space-y-3 max-h-64 overflow-y-auto">
								{actionHistory.map((log) => (
									<div
										key={log.id}
										className="p-3 bg-[#1c1610] border border-[#493622] rounded-lg flex justify-between items-start"
									>
										<div className="text-sm flex-1">
											<p className="text-white font-semibold capitalize">
												{log.action.replace(/_/g, " ")}
											</p>
											{log.details?.reason && (
												<p className="text-[#cbad90] text-xs mt-1 italic">
													Raison: {log.details.reason}
												</p>
											)}
											{log.details?.previous_status && (
												<p className="text-[#cbad90] text-xs mt-1">
													{log.details.previous_status} →{" "}
													{log.details.new_status}
												</p>
											)}
										</div>
										<div className="text-right">
											<p className="text-gray-500 text-xs">
												{new Date(
													log.created_at,
												).toLocaleDateString("fr-FR")}
											</p>
											<p className="text-gray-400 text-[10px]">
												{log.profiles?.name || "System"}
											</p>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Sidebar Actions */}
				<div className="lg:col-span-1 space-y-4">
					<div className="bg-[#2c241b] border border-[#493622] p-6 rounded-2xl space-y-3 sticky top-6">
						<h3 className="text-sm font-black text-white uppercase tracking-wide mb-4">
							Actions
						</h3>

						{canValidate() && (
							<button
								onClick={() =>
									setConfirmModal({
										open: true,
										action: "validate",
									})
								}
								className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl font-semibold text-sm hover:bg-green-500/20 transition-all"
							>
								<CheckCircle className="w-4 h-4" />
								Valider
							</button>
						)}

						{canMarkPaid() && (
							<button
								onClick={() =>
									setConfirmModal({
										open: true,
										action: "mark_paid",
									})
								}
								className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-semibold text-sm hover:bg-blue-500/20 transition-all"
							>
								<Coins className="w-4 h-4" />
								Marquer payée
							</button>
						)}

						{canCancel() && (
							<button
								onClick={() =>
									setConfirmModal({
										open: true,
										action: "cancel",
									})
								}
								className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-semibold text-sm hover:bg-red-500/20 transition-all"
							>
								<AlertCircle className="w-4 h-4" />
								Annuler
							</button>
						)}

						{booking.status === "Annulé" && (
							<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-xs">
								<Lock className="w-4 h-4 shrink-0 mt-0.5" />
								<p>
									Cette réservation est annulée et
									verrouillée.
								</p>
							</div>
						)}

						<button
							onClick={() => {
								const text = `Réservation ${booking.id} - ${booking.fields?.name} - ${booking.date}`;
								navigator.clipboard.writeText(text);
								toast.success("Copié !");
							}}
							className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#493622]/30 text-[#cbad90] border border-[#493622] rounded-xl text-sm hover:bg-[#493622]/50 transition-all"
						>
							<Download className="w-4 h-4" />
							Copier infos
						</button>
					</div>

					{/* Terrain Info */}
					<div className="bg-[#2c241b] border border-[#493622] p-4 rounded-2xl space-y-2">
						<p className="text-[10px] font-black text-[#cbad90] uppercase tracking-widest">
							Terrain
						</p>
						<p className="text-white font-bold text-sm">
							{booking.fields?.name}
						</p>
						<p className="text-[#cbad90] text-xs">
							{booking.fields?.pelouse} •{" "}
							{(
								booking.fields?.price_per_hour || 0
							).toLocaleString()}{" "}
							CFA/h
						</p>
					</div>
				</div>
			</div>

			{/* Modal de confirmation enrichie */}
			<ConfirmModalEnhanced
				isOpen={confirmModal.open}
				action={confirmModal.action}
				booking={booking}
				loading={actionLoading}
				onConfirm={handleAction}
				onCancel={() =>
					setConfirmModal({ open: false, action: null })
				}
			/>
		</div>
	);
}
