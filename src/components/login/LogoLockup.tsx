import memberPortalLogo from "../../assets/member-portal-logo.png";

export default function LogoLockup() {
  return (
    <div className="member-logo">
      <img
        src={memberPortalLogo.src}
        alt=""
        className="member-logo-symbol"
      />
      <div className="member-logo-text">
        <span>MEMBER</span>
        <span>PORTAL</span>
      </div>
    </div>
  );
}
