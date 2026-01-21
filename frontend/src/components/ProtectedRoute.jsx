export default function ProtectedRoute({ children }) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.accessToken) {
        window.location.href = "/login";
        return null;
    }
    return children;
}
