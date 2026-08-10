import Link from "next/link";
import type { DispatchData } from "@/types/dashboard";
import featuredDispatchImage from "../../assets/featured-dispatch.png";

interface FeaturedDispatchProps {
  dispatch: DispatchData;
}

export default function FeaturedDispatch({ dispatch }: FeaturedDispatchProps) {
  const imageSrc = dispatch.imageSrc ?? featuredDispatchImage.src;

  return (
    <article
      className="featured-dispatch"
      style={{ backgroundImage: `url(${imageSrc})` }}
    >
      <div className="featured-dispatch__overlay featured-dispatch-content">
        <p className="featured-dispatch__label">Featured Dispatch</p>
        <p className="featured-dispatch__number">{dispatch.number}</p>
        <h3 className="featured-dispatch__title">{dispatch.title}</h3>
        <div className="featured-dispatch__rule" aria-hidden="true" />
        <p className="featured-dispatch__desc featured-dispatch-description">
          {dispatch.description}
        </p>
        <Link href="#" className="featured-dispatch__cta">
          Read Dispatch →
        </Link>
      </div>
    </article>
  );
}
