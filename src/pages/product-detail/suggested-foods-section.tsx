import DishAddonSlider from "./dish-addon-slider";
import { mockListOfProduct } from "@/services/product/product.mock";
import type { Product } from "@/types/product.types";
import { PlusIcon } from "@/components/common/vectors";
import { formatCurrency } from "@/utils/format";
import { copy } from "@/constants/copy";
import { useNavigate } from "react-router-dom";
export default function SuggestedFoodsSection({product,quickAdd}:{product:Product;quickAdd:(product:Product)=>void}){const navigate=useNavigate();return <><div className="dish-section-heading dish-addon-heading">
                <span>02</span>
                <h2>Thêm vị cho bữa ăn</h2>
              </div>
              <p className="dish-addon-subtitle">Gợi ý món ăn kèm để bữa ăn thêm trọn vị.</p>
              <DishAddonSlider>
                {mockListOfProduct
                  .filter((rp) => rp.id !== product.id)
                  .sort((a, b) =>
                    Number(b.categoryId === product.categoryId) -
                    Number(a.categoryId === product.categoryId),
                  )
                  .slice(0, 14)
                  .map((rp) => (
                    <article
                      key={rp.id}
                      className="dish-related w-[140px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-neutral100/60 bg-white shadow-[0_2px_10px_rgba(15,11,8,0.06)] transition-all hover:shadow-cardLift active:scale-[0.98]"
                    >
                      <button
                        type="button"
                        aria-label={`Xem ${rp.name}`}
                        onClick={() => navigate(`/product/${rp.id}`)}
                        className="relative aspect-square w-full overflow-hidden"
                      >
                        <img
                          src={rp.image}
                          alt={rp.name}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                        {rp.newMarked && (
                          <div className="absolute left-2 top-2 rounded-full bg-terracotta500 px-2 py-0.5 text-xxxsmall-sb text-white">
                            MỚI
                          </div>
                        )}
                        {rp.sales?.discount && (
                          <div className="absolute right-2 top-2 rounded-full bg-red500 px-2 py-0.5 text-xxxsmall-sb text-white">
                            -{rp.sales.discount}%
                          </div>
                        )}
                      </button>
                      <div className="p-2.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/product/${rp.id}`)}
                          className="dish-related-name"
                        >
                          {rp.name}
                        </button>
                        <div className="flex items-center justify-between">
                          <span
                            className="bg-gold-gradient bg-clip-text text-xsmall-sb text-transparent"
                            style={{ WebkitTextFillColor: "transparent" }}
                          >
                            {formatCurrency(rp.sales?.specialPrice ?? rp.price)}
                            <span className="text-[10px]">
                              {copy.common.currency}
                            </span>
                          </span>
                          <button
                            type="button"
                            aria-label={`Thêm ${rp.name} vào giỏ`}
                            onClick={() => quickAdd(rp)}
                            className="dish-quick-add flex h-6 w-6 items-center justify-center rounded-md bg-gold-gradient text-white transition-transform active:scale-95"
                          >
                            <PlusIcon style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </DishAddonSlider></>;}
