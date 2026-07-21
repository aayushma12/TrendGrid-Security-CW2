import {
  SECTION_REGISTRY,
  type SectionContext,
  type SectionData,
} from "./sections";

/**
 * Renders an ordered list of page-builder sections. Each section type is mapped
 * to its component via the registry; unknown types render nothing (so a future
 * section type never crashes an old storefront build).
 *
 * Visibility flags (per breakpoint) are honoured via responsive utility data
 * attributes consumed by the storefront stylesheet.
 */
export function DynamicSectionRenderer({
  sections,
  ctx,
}: {
  sections: SectionData[];
  ctx: SectionContext;
}) {
  return (
    <>
      {sections
        .filter((s) => s.isVisible !== false)
        .map((s) => {
          const Component = SECTION_REGISTRY[s.type];
          if (!Component) return null;
          const hiddenClasses = [
            s.mobileHidden ? "ndh-hide-mobile" : "",
            s.tabletHidden ? "ndh-hide-tablet" : "",
            s.desktopHidden ? "ndh-hide-desktop" : "",
            s.customClasses ?? "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={s.id}
              id={s.anchorId ?? undefined}
              className={hiddenClasses || undefined}
              data-section-type={s.type}
            >
              <Component s={s} ctx={ctx} />
            </div>
          );
        })}
    </>
  );
}
