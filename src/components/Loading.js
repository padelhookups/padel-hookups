import logo from "../images/LogoWhite.svg";

export default function Loading({isGenericLoading}) {
    return <div
        style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: isGenericLoading ? '100vh' : '100%',
            backgroundColor: "#105DCE"
        }}>
        <img src={logo} alt="Loading..." />
    </div>;
}