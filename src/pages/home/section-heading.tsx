import { Link } from "react-router-dom";
import { MenuIcon } from "../menu/menu-components";
export function SectionHeading({
  title,
  description,
  all = false,
}: {
  title: string;
  description: string;
  all?: boolean;
}) {
  return (
    <div className="hv-home-section-heading">
      <span>
        <MenuIcon name="leaf" />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {all && <Link to="/menu?category=all">Xem tất cả →</Link>}
    </div>
  );
}
