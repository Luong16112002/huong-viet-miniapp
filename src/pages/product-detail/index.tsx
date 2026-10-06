import { HotpotDetails } from "../menu/hotpot-options";
import FoodDetailHero from "./food-detail-hero";
import SuggestedFoodsSection from "./suggested-foods-section";
import { FoodInfoSection, FoodNoteSection, TastePreferenceSection, AddToCartBar } from "./food-detail-sections";
import FoodAI from "./food-ai";
import "./food-detail.css";
import type { Product } from "@/types/product.types";
import VariantSelect from "@/components/common/variant-select";
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProduct } from "@/services/product/product.queries";
import { useCartStore } from "@/stores/cart.store";
import { Spinner, Text } from "zmp-ui";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";

type VariantSelections = {
  [variantGroupId: string]: {
    type: "SINGLE" | "MULTIPLE" | "ADJUSTMENT" | "QUANTITY";
    value: string | string[] | { [key: string]: number };
  };
};

export default function ProductDetailPage() {
  const [quantity, setQuantity] = useState(1);
  const [variantSelections, setVariantSelections] = useState<VariantSelections>(
    {},
  );
  const [note, setNote] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const editCartItemId = searchParams.get("editCartItemId");
  const isEditMode = !!editCartItemId;

  const { data: product, isLoading, isError } = useProduct(id || "");
  const { addToCart, updateCartItem, items, totalItems } = useCartStore();

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".dish-page");
    const bar = page?.querySelector<HTMLElement>(".dish-order-bar");
    if (!page || !bar) return;
    const update = () => {
      const height = bar.getBoundingClientRect().height;
      page.style.setProperty("--dish-checkout-height", height + "px");
      page.closest<HTMLElement>(".app-shell")?.style.setProperty("--dish-checkout-height", height + "px");
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => { observer.disconnect(); page.closest<HTMLElement>(".app-shell")?.style.removeProperty("--dish-checkout-height"); };
  }, [product?.id]);


  useEffect(() => {
    setQuantity(1);
    setNote("");
    setVariantSelections({});
    setFeedback("");
    try {
      setIsFavorite(
        JSON.parse(localStorage.getItem("favorite-dishes") || "[]").includes(
          id,
        ),
      );
    } catch {
      setIsFavorite(false);
    }
  }, [id]);

  useEffect(() => {
    if (!product || isEditMode) return;
    const defaults: VariantSelections = {};
    product.variantGroups.forEach((group) => {
      if (group.type === "SINGLE") {
        const option = group.options.find(
          (option) => option.defaultValue === true,
        );
        if (option) defaults[group.id] = { type: group.type, value: option.id };
      } else if (group.type === "ADJUSTMENT" || group.type === "QUANTITY") {
        defaults[group.id] = {
          type: group.type,
          value: Object.fromEntries(
            group.options.map((option) => [
              option.id,
              typeof option.defaultValue === "number"
                ? option.defaultValue
                : typeof option.value === "number"
                  ? option.value
                  : 0,
            ]),
          ),
        };
      }
    });
    setVariantSelections(defaults);
  }, [product, isEditMode]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(""), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const toggleFavorite = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("favorite-dishes") || "[]");
      const favorites = Array.isArray(saved) ? saved : [];
      localStorage.setItem(
        "favorite-dishes",
        JSON.stringify(
          isFavorite
            ? favorites.filter((value: string) => value !== id)
            : [...favorites, id],
        ),
      );
      setIsFavorite(!isFavorite);
      setFeedback(isFavorite ? "Đã bỏ lưu món ăn" : "Đã lưu món ăn yêu thích");
    } catch {
      setFeedback("Chưa lưu được món yêu thích trên thiết bị này.");
    }
  };
  const shareDish = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("editCartItemId");
      if (navigator.share)
        await navigator.share({ title: product?.name, url: url.href });
      else {
        await navigator.clipboard.writeText(url.href);
        setFeedback("Đã sao chép liên kết món ăn");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setFeedback("Chưa chia sẻ được. Bạn có thể sao chép địa chỉ trang.");
    }
  };

  useEffect(() => {
    if (!isEditMode || !editCartItemId || !product) return;

    const cartItem = items.find((item) => item.id === editCartItemId);
    if (!cartItem) return;

    setQuantity(cartItem.quantity);
    setNote(cartItem.note || "");

    const reconstructedSelections: VariantSelections = {};

    cartItem.selectedVariants.forEach((selectedVariant) => {
      const variantGroup = product.variantGroups.find(
        (vg) => vg.id === String(selectedVariant.groupId),
      );

      if (!variantGroup) return;

      const groupId = variantGroup.id;

      switch (variantGroup.type) {
        case "SINGLE": {
          const singleOption = variantGroup.options.find(
            (opt) => opt.id === String(selectedVariant.optionId),
          );
          if (singleOption) {
            reconstructedSelections[groupId] = {
              type: "SINGLE",
              value: singleOption.id,
            };
          }
          break;
        }

        case "MULTIPLE": {
          if (!reconstructedSelections[groupId]) {
            reconstructedSelections[groupId] = {
              type: "MULTIPLE",
              value: [],
            };
          }
          const multipleOption = variantGroup.options.find(
            (opt) => opt.id === String(selectedVariant.optionId),
          );
          if (multipleOption) {
            (reconstructedSelections[groupId].value as string[]).push(
              multipleOption.id,
            );
          }
          break;
        }

        case "ADJUSTMENT":
        case "QUANTITY": {
          if (!reconstructedSelections[groupId]) {
            reconstructedSelections[groupId] = {
              type: variantGroup.type,
              value: {},
            };
          }
          const adjOption = variantGroup.options.find(
            (opt) => opt.id === String(selectedVariant.optionId),
          );
          if (adjOption) {
            (reconstructedSelections[groupId].value as Record<string, number>)[
              adjOption.id
            ] = selectedVariant.quantity || 1;
          }
          break;
        }
      }
    });

    setVariantSelections(reconstructedSelections);
  }, [isEditMode, editCartItemId, items, product]);

  const handleVariantChange = (
    variantGroupId: string,
    value: any,
    type: string,
  ) => {
    setVariantSelections((prev) => ({
      ...prev,
      [variantGroupId]: {
        type: type as "SINGLE" | "MULTIPLE" | "ADJUSTMENT" | "QUANTITY",
        value,
      },
    }));
  };

  const totalPrice = useMemo(() => {
    if (!product) return 0;

    let basePrice = product.sales?.specialPrice ?? product.price;
    let variantPrice = 0;

    product.variantGroups.forEach((variantGroup) => {
      const selection = variantSelections[variantGroup.id];
      if (!selection) return;

      switch (variantGroup.type) {
        case "SINGLE":
          if (typeof selection.value === "string") {
            const selectedOption = variantGroup.options.find(
              (opt) => opt.id === selection.value,
            );
            if (selectedOption) {
              variantPrice += selectedOption.extraPrice;
            }
          }
          break;

        case "MULTIPLE":
          if (Array.isArray(selection.value)) {
            selection.value.forEach((optionId) => {
              const selectedOption = variantGroup.options.find(
                (opt) => opt.id === optionId,
              );
              if (selectedOption) {
                variantPrice += selectedOption.extraPrice;
              }
            });
          }
          break;

        case "ADJUSTMENT":
          if (
            typeof selection.value === "object" &&
            !Array.isArray(selection.value)
          ) {
            Object.entries(selection.value).forEach(
              ([optionId, adjustmentValue]) => {
                const selectedOption = variantGroup.options.find(
                  (opt) => opt.id === optionId,
                );
                if (selectedOption && typeof adjustmentValue === "number") {
                  variantPrice += selectedOption.extraPrice * adjustmentValue;
                }
              },
            );
          }
          break;

        case "QUANTITY":
          if (
            typeof selection.value === "object" &&
            !Array.isArray(selection.value)
          ) {
            Object.entries(selection.value).forEach(([optionId, qty]) => {
              const selectedOption = variantGroup.options.find(
                (opt) => opt.id === optionId,
              );
              if (selectedOption && typeof qty === "number") {
                variantPrice += selectedOption.extraPrice * qty;
              }
            });
          }
          break;
      }
    });

    return (basePrice + variantPrice) * quantity;
  }, [product, variantSelections, quantity]);

  const quickAdd = (dish: Product) => {
    if (dish.variantGroups.length > 0) {
      navigate(`/product/${dish.id}`);
      return;
    }
    addToCart({
      productId: dish.id,
      productName: dish.name,
      productImage: dish.image,
      basePrice: dish.sales?.specialPrice ?? dish.price,
      quantity: 1,
      selectedVariants: [],
    });
    setFeedback(`Đã thêm ${dish.name} vào giỏ hàng`);
  };

  const handleAddToCart = (stayOnPage = false) => {
    if (!product) return false;

    const missing = product.variantGroups.find((group) => {
      if (!group.isRequired) return false;
      const value = variantSelections[group.id]?.value;
      return (
        !value ||
        (Array.isArray(value)
          ? value.length === 0
          : typeof value === "object"
            ? !Object.values(value).some((qty) => qty > 0)
            : false)
      );
    });
    if (missing) {
      setFeedback("Vui lòng chọn " + missing.title.toLowerCase());
      document
        .getElementById("dish-options")
        ?.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    const selectedVariants: Array<{
      groupId: number | string;
      groupTitle: string;
      optionId: number | string;
      optionName: string;
      extraPrice: number;
      quantity?: number;
    }> = [];

    Object.entries(variantSelections).forEach(([groupId, selection]) => {
      const variantGroup = product.variantGroups.find(
        (vg) => vg.id === groupId,
      );
      if (!variantGroup) return;

      switch (selection.type) {
        case "SINGLE":
          if (typeof selection.value === "string") {
            const option = variantGroup.options.find(
              (opt) => opt.id === selection.value,
            );
            if (option) {
              selectedVariants.push({
                groupId: groupId,
                groupTitle: variantGroup.title,
                optionId: option.id,
                optionName: option.name,
                extraPrice: option.extraPrice,
              });
            }
          }
          break;

        case "MULTIPLE":
          if (Array.isArray(selection.value)) {
            selection.value.forEach((optionId: string) => {
              const option = variantGroup.options.find(
                (opt) => opt.id === optionId,
              );
              if (option) {
                selectedVariants.push({
                  groupId: groupId,
                  groupTitle: variantGroup.title,
                  optionId: option.id,
                  optionName: option.name,
                  extraPrice: option.extraPrice,
                });
              }
            });
          }
          break;

        case "ADJUSTMENT":
        case "QUANTITY":
          if (
            typeof selection.value === "object" &&
            !Array.isArray(selection.value)
          ) {
            Object.entries(selection.value).forEach(([optionId, qty]) => {
              const option = variantGroup.options.find(
                (opt) => opt.id === optionId,
              );
              if (option && typeof qty === "number" && qty > 0) {
                selectedVariants.push({
                  groupId: groupId,
                  groupTitle: variantGroup.title,
                  optionId: option.id,
                  optionName: option.name,
                  extraPrice: option.extraPrice,
                  quantity: qty,
                });
              }
            });
          }
          break;
      }
    });

    const cartItemData = {
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      basePrice: product.sales?.specialPrice ?? product.price,
      selectedVariants,
      quantity,
      note: note || undefined,
    };

    if (isEditMode && editCartItemId) {
      updateCartItem(editCartItemId, cartItemData);
    } else {
      addToCart(cartItemData);
    }

    setFeedback(isEditMode ? "Đã cập nhật món trong giỏ" : "Đã thêm món vào giỏ");
    if (!stayOnPage) navigate("/cart");
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Spinner />
          <Text size="xSmall" className="mt-2 text-text-tertiary">
            {copy.product.loading}
          </Text>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text size="xSmall" className="text-text-tertiary">
          {copy.product.notFound}
        </Text>
      </div>
    );
  }

  return (
    <div className="dish-page">
      <div className="dish-scroll no-scrollbar">
        <div className="dish-layout">
          <FoodDetailHero product={product} onBack={() => navigate(product.subCategoryId === "lau" ? "/menu?category=hotpot" : "/menu")} shareDish={shareDish} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
          <div className="dish-details">
            <FoodInfoSection product={product}>
              <FoodAI key={product.id} product={product} onAddCurrent={() => handleAddToCart(true)} editMode={isEditMode} />
              <HotpotDetails product={product} />
            </FoodInfoSection>
            <div className="dish-help">
              <span>✦</span>
              <div>
                <strong>Một chút riêng cho khẩu vị của bạn</strong>
                <p>
                  Nhắn bếp nếu cần điều chỉnh món. Nếu có dị ứng, hãy xác nhận thành phần với nhà hàng.
                </p>
              </div>
            </div>
            <div id="dish-options" className="dish-options">
              <div className="dish-section-heading">
                <span>01</span>
                <h2>Chọn theo khẩu vị</h2>
              </div>
              {product.variantGroups.length === 0 && !["drink", "dessert"].includes(product.categoryId) && <TastePreferenceSection note={note} onChange={value => { if(value.length <= 200) setNote(value); else setFeedback("Ghi chú tối đa 200 ký tự."); }} />}
              {product.variantGroups.map((variantGroup) => {
                const selection = variantSelections[variantGroup.id];

                return (
                  <div
                    key={variantGroup.id}
                    className="rounded-2xl border border-neutral100/60 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-[17px] text-heading_serif text-espresso800">
                          {variantGroup.title}
                        </h3>
                        {variantGroup.description && (
                          <p className="mt-0.5 text-xsmall text-neutral500">
                            {variantGroup.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xxxsmall-sb tracking-wide ${
                          variantGroup.isRequired
                            ? "border border-gold400/30 bg-gold400/15 text-gold700"
                            : "border border-neutral200 bg-neutral100 text-neutral600"
                        }`}
                      >
                        {variantGroup.isRequired
                          ? `(${copy.product.required})`
                          : `(${copy.product.optional})`}
                      </span>
                    </div>
                    <div className="-mx-1">
                      <VariantSelect
                        variantGroup={variantGroup}
                        selectedOptionId={
                          variantGroup.type === "SINGLE" &&
                          typeof selection?.value === "string"
                            ? selection.value
                            : undefined
                        }
                        selectedOptionIds={
                          variantGroup.type === "MULTIPLE" &&
                          Array.isArray(selection?.value)
                            ? selection.value
                            : []
                        }
                        selectedValues={
                          (variantGroup.type === "ADJUSTMENT" ||
                            variantGroup.type === "QUANTITY") &&
                          typeof selection?.value === "object" &&
                          !Array.isArray(selection?.value)
                            ? (selection.value as Record<string, number>)
                            : {}
                        }
                        onSelect={(optionId) => {
                          if (variantGroup.type === "SINGLE") {
                            handleVariantChange(
                              variantGroup.id,
                              optionId,
                              variantGroup.type,
                            );
                          } else if (variantGroup.type === "MULTIPLE") {
                            const currentSelection = Array.isArray(
                              selection?.value,
                            )
                              ? selection.value
                              : [];
                            const newSelection = currentSelection.includes(
                              optionId,
                            )
                              ? currentSelection.filter((id) => id !== optionId)
                              : [...currentSelection, optionId];
                            handleVariantChange(
                              variantGroup.id,
                              newSelection,
                              variantGroup.type,
                            );
                          }
                        }}
                        onValueChange={(optionId, value) => {
                          const currentValues =
                            typeof selection?.value === "object" &&
                            !Array.isArray(selection?.value)
                              ? (selection.value as Record<string, number>)
                              : {};
                          handleVariantChange(
                            variantGroup.id,
                            { ...currentValues, [optionId]: value },
                            variantGroup.type,
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              <FoodNoteSection note={note} onChange={setNote} />

              <SuggestedFoodsSection product={product} quickAdd={quickAdd} />

            </div>
          </div>
        </div>
      </div>
      <AddToCartBar total={totalPrice} quantity={quantity} onQuantity={setQuantity} onAdd={() => handleAddToCart(true)} edit={isEditMode} count={totalItems} onCart={() => navigate("/cart")} feedback={feedback} />
    </div>
  );
}
