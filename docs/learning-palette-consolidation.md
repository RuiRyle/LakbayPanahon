# Learning palette consolidation

6 November 2026. Local implementation, not deployed.

learning-tokens.css is the shared source for navy surface/ink, secondary text, paper/ink/link, selected state, success and retry colors. Both story and chapter challenge pages load it before learning-contrast.css, which maps these tokens to existing components. The shared component mappings no longer repeat raw state colors.

Removed forced overrides from dark learning components and the legacy challenge-review explanation paragraph. Dark text pairing now follows ordinary scoped specificity. Paper ink retains a documented scoped important override because the legacy global theme still forces every main heading pale; removing that global rule would affect unrelated pages and is outside this focused pass.

This consolidates the final learning palette, not the whole site's historical CSS. Layout/spacing and gameplay are unchanged. Other legacy style sheets remain; migrate them incrementally with representative rendered-state checks rather than deleting broad shared rules without coverage.

Validation: learning-text-contrast-browser.cjs passed all 108 representative foreground/background checks across challenge, normal/paper lesson modes at mobile/desktop widths. This does not certify every visual state, image background or native menu. No database/schema/reward changes.
