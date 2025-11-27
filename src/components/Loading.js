import logo from "../images/LogoWhite.svg";

export default function Loading({isGenericLoading}) {
    return <div
        style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: isGenericLoading ? '100vh' : '100%',
        }}>
        <img style={{ width: '80%', maxHeight: '50%' }} src={logo} alt="Loading..." />
    </div>;
}