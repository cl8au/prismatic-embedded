import merge from "lodash.merge";

import { styles } from "../styles";
import { closePopover } from "../utils/popover";
import stateService, { State, ValidKeys } from "../state";
import {
  EMBEDDED_ID,
  EMBEDDED_IFRAME_CONTAINER_CLASS,
  EMBEDDED_IFRAME_PRELOAD_ID,
  EMBEDDED_OVERLAY_CLASS,
  EMBEDDED_OVERLAY_SELECTOR,
  EMBEDDED_OVERLAY_VISIBLE_CLASS,
  EMBEDDED_POPOVER_CLASS,
  EMBEDDED_POPOVER_CLOSE_CLASS,
} from "../utils/iframe";

export interface InitProps
  extends Pick<
      State,
      "screenConfiguration" | "theme" | "fontConfiguration" | "translation"
    >,
    Partial<Pick<State, "filters" | "prismaticUrl" | "skipPreload">> {}

export const EMBEDDED_DEFAULTS = {
  filters: {
    marketplace: {
      includeActiveIntegrations: true,
    },
    integrations: {},
    components: {},
  },
  screenConfiguration: {
    configurationWizard: {},
    instance: {},
    marketplace: {},
    initializing: {},
  },
  skipPreload: false,
  theme: "LIGHT",
  fontConfiguration: undefined,
  translation: {},
};

export const init = (optionsBase?: InitProps) => {
  const options: InitProps = merge({}, EMBEDDED_DEFAULTS, optionsBase);

  // when we initialize, start from the fresh default state
  const state = stateService.getInitialState();

  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (ValidKeys.has(key)) {
        state[key] = value;
      }
    });
  }

  state.initComplete = true;

  stateService.setState(state);

  const existingElement = document.getElementById(EMBEDDED_ID);

  if (existingElement) {
    return;
  }

  /**
   * This establishes a connection to the prismatic url and preloads
   * assets (css, js, fonts, etc.) into browser cache. Subsequent
   * calls, use existing connections and cached assets.
   */
  const existingIframePreload = document.getElementById(
    EMBEDDED_IFRAME_PRELOAD_ID
  );

  if (!existingIframePreload && !options.skipPreload) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<iframe
        id="${EMBEDDED_IFRAME_PRELOAD_ID}"
        src="${state.prismaticUrl}/embedded"
        style="visibility: hidden; display: none;"
        height="0"
        width="0"
      />`
    );
  }

  document.head.insertAdjacentHTML("beforeend", styles);

  const embeddedElement = document.createElement("div");

  embeddedElement.id = EMBEDDED_ID;

  embeddedElement.innerHTML = /* html */ `
    <div class="${EMBEDDED_OVERLAY_CLASS}">
      <div class="${EMBEDDED_POPOVER_CLASS}">
        <button class="${EMBEDDED_POPOVER_CLOSE_CLASS}" aria-label="close popover" data-close>✕</button>
        <div class="${EMBEDDED_IFRAME_CONTAINER_CLASS}"></div>
      </div>
    </div>
  `;

  document.body.appendChild(embeddedElement);

  const closeButtonElement = document.querySelector(
    `#${EMBEDDED_ID} .${EMBEDDED_POPOVER_CLOSE_CLASS}`
  );

  const overlayElement = document.querySelector(EMBEDDED_OVERLAY_SELECTOR);

  overlayElement?.addEventListener("click", (event) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    closePopover();
  });

  closeButtonElement?.addEventListener("click", () => closePopover());

  document.addEventListener("keyup", (e) => {
    if (
      e.key === "Escape" &&
      document.querySelector(`.${EMBEDDED_OVERLAY_VISIBLE_CLASS}`)
    ) {
      closePopover();
    }
  });
};
