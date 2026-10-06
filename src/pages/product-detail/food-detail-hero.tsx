import type { Product } from "@/types/product.types";
import { BackIcon } from "@/components/common/vectors";
function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 6L12 2L8 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2V15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M20.8401 4.60987C20.3294 4.099 19.7229 3.69364 19.0555 3.41708C18.3882 3.14052 17.6726 2.99817 16.9501 2.99817C16.2276 2.99817 15.5121 3.14052 14.8447 3.41708C14.1774 3.69364 13.5708 4.099 13.0601 4.60987L12.0001 5.66987L10.9401 4.60987C9.90846 3.57818 8.5092 2.99846 7.05011 2.99846C5.59102 2.99846 4.19176 3.57818 3.16007 4.60987C2.12837 5.64157 1.54865 7.04082 1.54865 8.49991C1.54865 9.95901 2.12837 11.3583 3.16007 12.3899L4.22007 13.4499L12.0001 21.23L19.7801 13.45L20.8401 12.3899C21.3509 11.8792 21.7563 11.2726 22.0328 10.6053C22.3094 9.9379 22.4517 9.22236 22.4517 8.49991C22.4517 7.77746 22.3094 7.06192 22.0328 6.39456C21.7563 5.7272 21.3509 5.12063 20.8401 4.60987Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


type Actions = { onBack: () => void; shareDish: () => void; isFavorite: boolean; toggleFavorite: () => void };
export function FoodDetailHeaderActions({onBack,shareDish,isFavorite,toggleFavorite}:Actions){return (<nav className="dish-toolbar" aria-label="Thao tác món ăn">
              <button
                aria-label="Quay lại thực đơn"
                onClick={onBack}
              >
                <BackIcon />
              </button>
              <span>HƯƠNG VIỆT</span>
              <button aria-label="Chia sẻ món ăn" onClick={shareDish}>
                <ShareIcon />
              </button>
              <button
                aria-label="Lưu món yêu thích"
                aria-pressed={isFavorite}
                onClick={toggleFavorite}
              >
                <HeartIcon
                  style={{
                    fill: isFavorite ? "#bc644b" : "none",
                    color: isFavorite ? "#bc644b" : "inherit",
                  }}
                />
              </button>
            </nav>);}
export default function FoodDetailHero({product,...actions}:Actions & {product:Product}){const {onBack,shareDish,isFavorite,toggleFavorite}=actions;return (<section className="dish-hero">
            <img
              src={product.image}
              alt={product.name}
              className="dish-photo"
            />
            <FoodDetailHeaderActions onBack={onBack} shareDish={shareDish} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
            <div className="dish-photo-caption">
              <span>THỰC ĐƠN HƯƠNG VỊ VIỆT</span>
              <p>
                Một món ngon,
                <br />
                <em>thêm trọn bữa vui.</em>
              </p>
            </div>
            {product.imageIsIllustration && (
              <small className="dish-image-note">Ảnh minh họa nhóm món</small>
            )}
          </section>);}
