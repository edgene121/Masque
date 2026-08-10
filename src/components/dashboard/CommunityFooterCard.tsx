import footerLogo from "../../assets/footer-logo.png";

export default function CommunityFooterCard() {
  return (
    <section className="community-footer-card">
      <img
        src={footerLogo.src}
        alt="Masqué"
        className="community-footer-logo"
      />
      <div className="community-footer-card__copy">
        <p className="community-footer-card__headline">
          Masque Is Built On Trust, Respect, And Shared Responsibility.
        </p>
        <p className="community-footer-card__thanks">
          Thank you for being part of this community.
        </p>
      </div>
    </section>
  );
}
