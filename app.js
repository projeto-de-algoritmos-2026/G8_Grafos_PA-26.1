const API_BASE = "";
const VIEWBOX_WIDTH = 2599;
const VIEWBOX_HEIGHT = 1733;
const ROUTER_LAYOUT = {
    canada: { x: 520, y: 420, anchor: "top-left", offsetX: -6, offsetY: -8 },
    estados_unidos: { x: 470, y: 660, anchor: "left", offsetX: -6, offsetY: -6 },
    mexico: { x: 500, y: 835, anchor: "left", offsetX: -6, offsetY: -2 },
    brasil: { x: 740, y: 1185, anchor: "top-left", offsetX: -8, offsetY: -4 },
    argentina: { x: 780, y: 1475, anchor: "bottom-left", offsetX: -8, offsetY: 8 },
    inglaterra: { x: 1215, y: 640, anchor: "top-left", offsetX: -6, offsetY: -8 },
    espanha: { x: 1175, y: 790, anchor: "left", offsetX: -8, offsetY: -4 },
    nigeria: { x: 1300, y: 1035, anchor: "left", offsetX: -8, offsetY: 2 },
    africa_do_sul: { x: 1440, y: 1490, anchor: "bottom", offsetX: -8, offsetY: 8 },
    india: { x: 1685, y: 985, anchor: "right", offsetX: 8, offsetY: -2 },
    china: { x: 1980, y: 850, anchor: "top-right", offsetX: 8, offsetY: -8 },
    japao: { x: 2215, y: 860, anchor: "right", offsetX: 8, offsetY: -4 },
    australia: { x: 2095, y: 1455, anchor: "bottom-right", offsetX: 8, offsetY: 8 },
};

const state = {
    network: { routers: [], links: [] },
    selectedRouterId: null,
    currentRoute: null,
};

const elements = {
    backendStatus: document.getElementById("backend-status"),
    clearRouteButton: document.getElementById("clear-route-button"),
    destinationInput: document.getElementById("destination-input"),
    networkLayer: document.getElementById("network-layer"),
    routeForm: document.getElementById("route-form"),
    routeSummary: document.getElementById("route-summary"),
    routerIdList: document.getElementById("router-id-list"),
    routerLayer: document.getElementById("router-layer"),
    selectedRouterCard: document.getElementById("selected-router-card"),
};

function normalizeRouterId(value) {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_");
}

function encodeQuery(value) {
    return encodeURIComponent(value);
}

function getRouterById(id) {
    return state.network.routers.find((router) => router.id === id) ?? null;
}

function getRouterLabel(id) {
    return getRouterById(id)?.label ?? id;
}

function getRouterDisplayPosition(router) {
    const layout = ROUTER_LAYOUT[router.id];

    if (layout) {
        return {
            x: layout.x,
            y: layout.y,
            anchor: layout.anchor,
            offsetX: layout.offsetX,
            offsetY: layout.offsetY,
        };
    }

    return {
        x: router.x,
        y: router.y,
        anchor: "top-right",
        offsetX: 0,
        offsetY: 0,
    };
}

function getDistanceMap() {
    const distances = state.currentRoute?.distances ?? [];
    return new Map(distances.map((entry) => [entry.id, entry]));
}

function getPathEdgeSet() {
    const edgeSet = new Set();
    const path = state.currentRoute?.path ?? [];

    for (let index = 0; index < path.length - 1; index += 1) {
        const key = [path[index], path[index + 1]].sort().join("::");
        edgeSet.add(key);
    }

    return edgeSet;
}

function setBackendStatus(mode, message) {
    elements.backendStatus.className = `status-banner status-banner--${mode}`;
    elements.backendStatus.textContent = message;
}

async function fetchJson(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, options);

    if (!response.ok) {
        throw new Error(`Falha na requisicao: ${response.status}`);
    }

    return response.json();
}

async function loadNetworkState() {
    const response = await fetchJson("/state");
    state.network = response;

    if (!state.selectedRouterId || !getRouterById(state.selectedRouterId)) {
        state.selectedRouterId = response.routers[0]?.id ?? null;
    }

    elements.routerIdList.innerHTML = response.routers
        .map((router) => `<option value="${router.id}"></option>`)
        .join("");

    setBackendStatus("online", "Servidor conectado e pronto.");
}

async function updateRouterPower(routerId, active) {
    await fetchJson(
        `/router/power?id=${encodeQuery(routerId)}&active=${active ? "1" : "0"}`,
        { method: "POST" }
    );

    await loadNetworkState();

    if (state.currentRoute?.source && state.currentRoute?.target) {
        await calculateRoute(state.currentRoute.source, state.currentRoute.target, true);
        return;
    }

    render();
}

async function calculateRoute(source, target, silent = false) {
    const normalizedTarget = normalizeRouterId(target);

    if (!source || !normalizedTarget) {
        return;
    }

    const response = await fetchJson(
        `/route?source=${encodeQuery(source)}&target=${encodeQuery(normalizedTarget)}`
    );

    state.currentRoute = {
        ...response,
        source,
        target: normalizedTarget,
    };

    if (!silent) {
        elements.destinationInput.value = normalizedTarget;
    }

    render();
}

function createSvgNode(name, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);

    Object.entries(attributes).forEach(([key, value]) => {
        node.setAttribute(key, String(value));
    });

    return node;
}

function renderNetworkLayer() {
    const pathEdges = getPathEdgeSet();
    const routerMap = new Map(state.network.routers.map((router) => [router.id, router]));

    elements.networkLayer.innerHTML = "";

    state.network.links.forEach((link) => {
        const from = routerMap.get(link.from);
        const to = routerMap.get(link.to);
        const fromPosition = from ? getRouterDisplayPosition(from) : null;
        const toPosition = to ? getRouterDisplayPosition(to) : null;

        if (!from || !to || !fromPosition || !toPosition) {
            return;
        }

        const edgeKey = [link.from, link.to].sort().join("::");
        const classes = ["network-link"];
        if (!link.available) {
            classes.push("network-link--inactive");
        }
        if (pathEdges.has(edgeKey)) {
            classes.push("network-link--path");
        }

        const line = createSvgNode("line", {
            class: classes.join(" "),
            x1: fromPosition.x,
            y1: fromPosition.y,
            x2: toPosition.x,
            y2: toPosition.y,
        });

        const midX = (fromPosition.x + toPosition.x) / 2;
        const midY = (fromPosition.y + toPosition.y) / 2;
        const group = createSvgNode("g", {
            class: "network-cost-pill",
            transform: `translate(${midX}, ${midY})`,
        });
        const rect = createSvgNode("rect", {
            x: -26,
            y: -20,
            rx: 14,
            width: 52,
            height: 40,
        });
        const text = createSvgNode("text", {
            "text-anchor": "middle",
            dy: 10,
        });
        text.textContent = link.cost;

        group.append(rect, text);
        elements.networkLayer.append(line, group);
    });
}

function renderRouterLayer() {
    const distanceMap = getDistanceMap();
    const pathRouters = new Set(state.currentRoute?.path ?? []);

    elements.routerLayer.innerHTML = "";

    state.network.routers.forEach((router) => {
        const wrapper = document.createElement("div");
        const nodeButton = document.createElement("button");
        const switchButton = document.createElement("button");
        const distance = distanceMap.get(router.id);
        const classes = ["router-node"];
        const layout = getRouterDisplayPosition(router);

        wrapper.className = "router-point";
        wrapper.style.left = `${(layout.x / VIEWBOX_WIDTH) * 100}%`;
        wrapper.style.top = `${(layout.y / VIEWBOX_HEIGHT) * 100}%`;
        wrapper.dataset.anchor = layout.anchor;
        wrapper.style.setProperty("--offset-x", `${layout.offsetX}px`);
        wrapper.style.setProperty("--offset-y", `${layout.offsetY}px`);

        if (state.selectedRouterId === router.id) {
            classes.push("router-node--selected");
        }

        if (!router.active) {
            classes.push("router-node--inactive");
        }

        if (pathRouters.has(router.id)) {
            classes.push("router-node--path");
        }

        nodeButton.type = "button";
        nodeButton.className = classes.join(" ");
        nodeButton.innerHTML = `
            <span class="router-node__label">${router.label}</span>
            <span class="router-node__distance ${distance && distance.reachable ? "" : "router-node__distance--inf"}">
                ${!distance ? "Sem calculo" : distance.active === false ? "Desligado" : distance.reachable ? `custo ${distance.cost}` : "Sem rota"}
            </span>
        `;
        nodeButton.addEventListener("click", () => {
            state.selectedRouterId = router.id;
            render();
        });

        switchButton.type = "button";
        switchButton.className = "router-switch";
        switchButton.dataset.active = String(router.active);
        switchButton.textContent = router.active ? "ON" : "OFF";
        switchButton.title = router.active ? "Desligar roteador" : "Ligar roteador";
        switchButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await runGuarded(async () => {
                await updateRouterPower(router.id, !router.active);
            });
        });

        wrapper.append(nodeButton, switchButton);
        elements.routerLayer.appendChild(wrapper);
    });
}

function renderSelectedRouter() {
    const router = getRouterById(state.selectedRouterId);

    if (!router) {
        elements.selectedRouterCard.innerHTML = '<p class="empty-state">Nenhum roteador disponivel no momento.</p>';
        return;
    }

    elements.selectedRouterCard.innerHTML = `
        <h3>${router.label}</h3>
        <p>Origem selecionada para o proximo calculo.</p>
        <div class="selected-router-card__row">
            <span class="status-pill ${router.active ? "status-pill--on" : "status-pill--off"}">
                ${router.active ? "Ligado" : "Desligado"}
            </span>
            <button
                id="selected-router-power"
                class="power-button"
                type="button"
                data-active="${router.active}"
            >
                ${router.active ? "Desligar" : "Ligar"}
            </button>
        </div>
    `;

    const powerButton = document.getElementById("selected-router-power");
    powerButton?.addEventListener("click", async () => {
        await runGuarded(async () => {
            await updateRouterPower(router.id, !router.active);
        });
    });
}

function renderRouteSummary() {
    if (!state.currentRoute) {
        elements.routeSummary.innerHTML = `
            <p class="empty-state">Selecione a origem e informe um destino para calcular a rota.</p>
        `;
        return;
    }

    const sourceLabel = getRouterLabel(state.currentRoute.source);
    const targetLabel = getRouterLabel(state.currentRoute.target);
    const summaryClass = state.currentRoute.reachable ? "route-chip" : "route-chip route-chip--error";
    const chips = state.currentRoute.path?.length
        ? state.currentRoute.path.map((step) => `<span class="route-chip">${getRouterLabel(step)}</span>`).join("")
        : `<span class="${summaryClass}">Sem caminho</span>`;
    const costText = state.currentRoute.reachable
        ? `<span class="route-summary__cost">Custo ${state.currentRoute.cost}</span>`
        : "";

    elements.routeSummary.innerHTML = `
        <div class="route-summary__header">
            <p class="route-summary__meta"><strong>${sourceLabel}</strong> -> <strong>${targetLabel}</strong></p>
            ${costText}
        </div>
        <p class="route-summary__message">${state.currentRoute.message}</p>
        <div class="route-summary__chips">${chips}</div>
    `;
}

function render() {
    renderNetworkLayer();
    renderRouterLayer();
    renderSelectedRouter();
    renderRouteSummary();
}

async function runGuarded(action) {
    try {
        await action();
    } catch (error) {
        console.error(error);
        setBackendStatus("offline", "Não foi possivel conectar-se ao servidor. Verifique se o servidor está em execução.");
    }
}

async function bootstrap() {
    elements.clearRouteButton.addEventListener("click", () => {
        state.currentRoute = null;
        elements.destinationInput.value = "";
        render();
    });

    elements.routeForm.addEventListener("submit", (event) => {
        event.preventDefault();
        void runGuarded(async () => {
            await calculateRoute(state.selectedRouterId, elements.destinationInput.value);
        });
    });

    await runGuarded(async () => {
        await loadNetworkState();
        render();
    });
}

void bootstrap();
