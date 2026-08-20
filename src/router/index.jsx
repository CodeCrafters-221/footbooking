import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Loader from "../components/Loader";

import Home from "../pages/Home";
import ProtectedRoute from "../components/ProtectedRoute";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
const SearchPage = lazy(
	() => import("../pages/SearchPage"),
);
const UserProfile = lazy(
	() => import("../pages/UserProfile"),
);
const TerrainDetails = lazy(
	() => import("../pages/TerrainDetails"),
);
const Login = lazy(() => import("../pages/Auth/Login"));
const Register = lazy(
	() => import("../pages/Auth/Register"),
);
const CreateProfile = lazy(
	() => import("../components/CreateProfile"),
);
const CreateField = lazy(
	() => import("../components/CreateField"),
);
const CreateFieldDetails = lazy(
	() => import("../components/CreateFieldDetails"),
);
const Dashboard = lazy(() => import("../pages/Dashboard"));
const MyFields = lazy(
	() => import("../pages/Dashboard/MyFields"),
);
const MyReservations = lazy(
	() => import("../pages/Dashboard/MyReservations"),
);
const Statistics = lazy(
	() => import("../pages/Dashboard/Statistics"),
);
const Revenues = lazy(
	() => import("../pages/Dashboard/Revenues"),
);
const CalendarMatch = lazy(
	() => import("../pages/Dashboard/CalendarMatch"),
);
const CreateFieldPage = lazy(
	() => import("../pages/Dashboard/CreateFieldPage"),
);
const EditFieldPage = lazy(
	() => import("../pages/Dashboard/EditFieldPage"),
);
const Settings = lazy(
	() => import("../pages/Dashboard/Settings"),
);
const MySubscriptions = lazy(
	() => import("../pages/Dashboard/MySubscriptions"),
);
const Owners = lazy(() => import("../pages/Owners"));
const NotFound = lazy(() => import("../sections/NotFound"));
import OwnerRedirect from "../components/OwnerRedirect";

// Admin Imports
import AdminLayout from "../layouts/AdminLayout";
const AdminDashboard = lazy(
	() => import("../pages/Admin/Dashboard"),
);
const AdminFields = lazy(
	() => import("../pages/Admin/Fields"),
);
const AdminBookings = lazy(
	() => import("../pages/Admin/Bookings"),
);
const BookingDetail = lazy(
	() => import("../pages/Admin/Bookings/BookingDetail"),
);
const AdminUsers = lazy(
	() => import("../pages/Admin/Users"),
);
const AdminOwners = lazy(
	() => import("../pages/Admin/Owners"),
);
const AdminSettings = lazy(
	() => import("../pages/Admin/Settings"),
);
const AdminReports = lazy(
	() => import("../pages/Admin/Reports"),
);

const withSuspense = (element) => (
	<Suspense fallback={<Loader />}>{element}</Suspense>
);

export const router = createBrowserRouter([
	// ✅ DASHBOARD (avec layout)
	{
		path: "/dashboard",
		element: (
			<ProtectedRoute allowedRoles={["owner"]}>
				<DashboardLayout />
			</ProtectedRoute>
		),
		children: [
			{ index: true, element: <Dashboard /> },
			{ path: "terrains", element: <MyFields /> },
			{ path: "calendar", element: <CalendarMatch /> },
			{ path: "reservations", element: <MyReservations /> },
			{ path: "abonnements", element: <MySubscriptions /> },
			{ path: "stats", element: <Statistics /> },
			{ path: "revenues", element: <Revenues /> },
			{
				path: "create-field",
				element: <CreateFieldPage />,
			},
			{
				path: "edit-field/:id",
				element: <EditFieldPage />,
			},
			{ path: "compte", element: <Settings /> },
		],
	},

	// ✅ ADMIN (avec layout spécifique)
	{
		path: "/admin",
		element: (
			<ProtectedRoute allowedRoles={["super_admin"]}>
				<AdminLayout />
			</ProtectedRoute>
		),
		children: [
			{
				index: true,
				element: withSuspense(<AdminDashboard />),
			},
			{
				path: "terrains",
				element: withSuspense(<AdminFields />),
			},
			{
				path: "reservations",
				element: withSuspense(<AdminBookings />),
			},
			{
				path: "reservations/:id",
				element: withSuspense(<BookingDetail />),
			},
			{
				path: "utilisateurs",
				element: withSuspense(<AdminUsers />),
			},
			{
				path: "proprietaires",
				element: withSuspense(<AdminOwners />),
			},
			{
				path: "signalements",
				element: withSuspense(<AdminReports />),
			},
			{
				path: "parametres",
				element: withSuspense(<AdminSettings />),
			},
		],
	},

	// ✅ APP (avec header/footer global)
	{
		element: (
			<OwnerRedirect>
				<AppLayout />
			</OwnerRedirect>
		),
		children: [
			{ path: "/", element: <Home /> },
			{ path: "/search", element: <SearchPage /> },
			{
				path: "/terrain-details/:id",
				element: <TerrainDetails />,
			},
			{
				path: "/compte",
				element: (
					<ProtectedRoute>
						<UserProfile />
					</ProtectedRoute>
				),
			},
		],
	},

	// ✅ AUTH (layout séparé)
	{
		element: <AuthLayout />,
		children: [
			{
				path: "/login",
				element: (
					<OwnerRedirect>
						<Login />
					</OwnerRedirect>
				),
			},
			{
				path: "/register",
				element: (
					<OwnerRedirect>
						<Register />
					</OwnerRedirect>
				),
			},
			{
				path: "/create-profile",
				element: (
					<ProtectedRoute>
						<CreateProfile />
					</ProtectedRoute>
				),
			},
			{
				path: "/create-field",
				element: (
					<ProtectedRoute allowedRoles={["owner"]}>
						<CreateField />
					</ProtectedRoute>
				),
			},
			{
				path: "/create-field-details",
				element: (
					<ProtectedRoute allowedRoles={["owner"]}>
						<CreateFieldDetails />
					</ProtectedRoute>
				),
			},
		],
	},

	// ✅ PAGE SIMPLE (sans layout)
	{
		path: "/owners",
		element: (
			<OwnerRedirect>
				{withSuspense(<Owners />)}
			</OwnerRedirect>
		),
	},

	{
		path: "*",
		element: withSuspense(<NotFound />),
	},
]);
