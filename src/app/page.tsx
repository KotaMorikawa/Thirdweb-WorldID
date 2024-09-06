import HomeComponent from "./components/HomeComponent";
import { cookies } from "next/headers";

const Home = () => {
  const cookieStore = cookies();
  const authToken = cookieStore.get("temp_auth_token");
  const errorToken = cookieStore.get("temp_auth_error");

  return <HomeComponent authToken={authToken} errorToken={errorToken} />;
};

export default Home;
