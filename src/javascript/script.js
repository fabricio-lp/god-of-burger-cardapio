const MENU_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSOYub5NbfMGBabPgcfUgP2VkdJIUVVATwf1pA1qjp0LGokHBLWpHYx-x3OghWlmiRpzh7ufSbq4WC3/pub?output=csv";

$(document).ready(function () {
  $("#mobile_btn").on("click", function () {
    $("#mobile_menu").toggleClass("active");
    $("#mobile_btn").find("i").toggleClass("fa-bars fa-x");
  });

  $("#menu").text("Carregando cardápio...");
  loadMenuFromSheets();
});

function loadMenuFromSheets() {
  Papa.parse(MENU_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    beforeFirstChunk: function (chunk) {
      const lines = chunk.split(/\r\n|\n|\r/);
      let firstHeaderRow = -1;
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes("Categoria") &&
          lines[i].includes("Nome do Item")
        ) {
          firstHeaderRow = i;
          break;
        }
      }
      if (firstHeaderRow !== -1) {
        return lines.slice(firstHeaderRow).join("\n");
      }
      return chunk;
    },
    transformHeader: (header) => header.trim(),
    complete: function (results) {
      if (!results || !results.data || results.data.length === 0) {
        $("#menu").text(
          "Não foram encontrados itens no cardápio. Verifique a planilha."
        );
        return;
      }
      generateMenu(results.data);
    },
    error: function (error, file) {
      console.error("Error loading CSV:", error, file);
      $("#menu").text(
        "Erro ao carregar o cardápio. Verifique a conexão ou o link da planilha."
      );
    },
  });
}

function generateMenu(data) {
  const menuSection = $("#menu");
  menuSection.empty();

  const categories = {};
  data.forEach((item) => {
    if (item && item["Categoria"] && item["Nome do Item"]) {
      const category = item["Categoria"].trim().toUpperCase();
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    }
  });

  const categoryCount = Object.keys(categories).length;
  if (categoryCount === 0) {
    menuSection.html(
      'Nenhum item de cardápio válido encontrado. <br><b>Causa provável:</b> Os nomes das colunas na planilha ("Categoria", "Nome do Item", etc.) não correspondem exatamente ao esperado. <br>Por favor, verifique se há erros de digitação ou espaços extras nos cabeçalhos da planilha do Google.'
    );
    return;
  }

  const categoryOrder = ["HAMBURGUERES", "ADICIONAIS"];

  const remainingCategories = Object.keys(categories).filter(
    (c) => !categoryOrder.includes(c)
  );
  const finalOrder = [...categoryOrder, ...remainingCategories];

  finalOrder.forEach((category) => {
    if (categories[category]) {
      const titleHtml =
        category === "ADICIONAIS"
          ? category.toUpperCase()
          : "<br>" + category.toUpperCase();
      const categoryTitle = $("<h1>")
        .addClass("beverages_title")
        .html(titleHtml);

      if (category === "ADICIONAIS") {
        const adicionaisListDiv = $("<div>").addClass("adicionais_list");
        categories[category].forEach((item) => {
          const priceString = item["Preço (R$)"];
          let priceText = "";
          if (priceString && !isNaN(parseFloat(priceString))) {
            priceText =
              "R$ " + parseFloat(priceString).toFixed(2).replace(".", ",");
          }

          const itemDiv = $("<div>").addClass("adicionais_item");
          const nameSpan = $("<span>")
            .addClass("adicionais_name")
            .text(item["Nome do Item"]);
          const priceSpan = $("<span>")
            .addClass("adicionais_price")
            .text(priceText);

          itemDiv.append(nameSpan, priceSpan);
          adicionaisListDiv.append(itemDiv);
        });
        menuSection.append(categoryTitle, adicionaisListDiv);
      } else {
        const menuItemsDiv = $("<div>").addClass("menu_items");
        categories[category].forEach((item) => {
          const itemDiv = $("<div>").addClass(getItemClass(category));

          let imageUrl = generateImagePath(item["Nome do Item"]);
          if (item["Foto"] && item["Foto"].trim() !== "") {
            imageUrl = item["Foto"].trim();
          }

          const itemImg = $("<img>")
            .attr("src", imageUrl)
            .addClass(getImgClass(category))
            .on("error", function () {
              $(this).attr("src", "src/images/example.png");
            });

          const imgContainer = $("<div>")
            .addClass("img-container")
            .addClass(getImgClass(category) + "-container");
          imgContainer.append(itemImg);

          const itemTitle = $("<h2>")
            .addClass("item-title")
            .text(item["Nome do Item"]);
          const itemDesc = $("<p>")
            .addClass(getDescClass(category))
            .text(item["Descrição"])
            .attr("title", item["Descrição"] ? item["Descrição"].trim() : "");

          const priceString = item["Preço (R$)"];
          let priceText = "";
          if (priceString && !isNaN(parseFloat(priceString))) {
            priceText =
              "R$ " + parseFloat(priceString).toFixed(2).replace(".", ",");
          }
          const itemBtn = $("<button>").addClass("btn-default").text(priceText);

          if (priceText) {
            itemDiv.append(imgContainer, itemTitle, itemDesc, itemBtn);
          } else {
            itemDiv.append(imgContainer, itemTitle, itemDesc);
          }
          menuItemsDiv.append(itemDiv);

          setTimeout(function () {
            const descEl = itemDiv.find(
              ".item-description, .item-description_2"
            );
            if (descEl.length && descEl.text().trim() !== "") {
              const el = descEl[0];
              if (el.scrollHeight > el.clientHeight + 2) {
                const descId =
                  "desc-" + Math.random().toString(36).substr(2, 9);
                descEl.attr("id", descId);
                descEl.attr("aria-hidden", "true");

                itemDiv.attr({
                  tabindex: "0",
                  role: "button",
                  "aria-controls": descId,
                  "aria-expanded": "false",
                });
                itemDiv.css("cursor", "pointer");
                itemDiv.addClass("expandable");

                const chevron = $("<i>")
                  .addClass("fa-solid fa-chevron-down chevron-icon")
                  .attr("aria-hidden", "true");
                itemDiv.append(chevron);

                const toggleDesc = function () {
                  const expanded = descEl.hasClass("expanded");
                  if (expanded) {
                    descEl.removeClass("expanded");
                    descEl.attr("aria-hidden", "true");
                    itemDiv
                      .attr("aria-expanded", "false")
                      .removeClass("is-expanded");
                  } else {
                    itemDiv
                      .siblings('[aria-expanded="true"]')
                      .each(function () {
                        const sib = $(this);
                        sib
                          .attr("aria-expanded", "false")
                          .removeClass("is-expanded");
                        sib
                          .find(".item-description")
                          .removeClass("expanded")
                          .attr("aria-hidden", "true");
                      });
                    descEl.addClass("expanded");
                    descEl.attr("aria-hidden", "false");
                    itemDiv
                      .attr("aria-expanded", "true")
                      .addClass("is-expanded");
                  }
                };

                itemDiv.on("click", function (e) {
                  if ($(e.target).closest("button, a, .btn-default").length)
                    return;
                  toggleDesc();
                });

                itemDiv.on("keydown", function (e) {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleDesc();
                  }
                });

                itemDiv
                  .find(".desc-toggle")
                  .off("click")
                  .on("click", function (e) {
                    e.preventDefault();
                    toggleDesc();
                  });
              }
            }
          }, 0);
        });
        if (category === "HAMBURGUERES") {
          categoryTitle.css({
            height: "0",
            margin: "0",
            padding: "0",
            overflow: "hidden",
            opacity: "0",
            border: "none",
          });
          menuSection.append(categoryTitle, menuItemsDiv);
        } else {
          menuSection.append(categoryTitle, menuItemsDiv);
        }
      }
    }
  });
  setupStickyCategory();
}

function getItemClass(category) {
  const normalized = category
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const classes = {
    HAMBURGUERES: "hamburguer",
    ACOMPANHAMENTOS: "acompanhamento",
    BEBIDAS: "bebida",
  };
  return classes[normalized] || "item";
}

function getDescClass(category) {
  const normalized = category
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return normalized === "BEBIDAS" || normalized === "ACOMPANHAMENTOS"
    ? "item-description_2"
    : "item-description";
}

function getImgClass(category) {
  const normalized = category
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const classes = {
    HAMBURGUERES: "h_img",
    ACOMPANHAMENTOS: "a_img",
    BEBIDAS: "b_img",
  };
  return classes[normalized] || "img";
}

function generateImagePath(itemName) {
  if (!itemName) return "src/images/example.png";
  const imageName = itemName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/__/g, "_");
  return `src/images/${imageName}.png`;
}

function setupStickyCategory() {
  const sticky = $("#sticky_category");
  if (!sticky.length) return;

  const titles = $("#menu").find(".beverages_title");
  if (!titles.length) return;

  let ticking = false;
  let titleData = [];
  let menuTop = $("#menu").offset() ? $("#menu").offset().top : 0;

  function computePositions() {
    titleData = [];
    titles.each(function () {
      const $t = $(this);
      titleData.push({ el: $t, top: $t.offset().top });
    });
    const menuOffset = $("#menu").offset();
    menuTop = menuOffset ? menuOffset.top : 0;
  }

  function updateSticky() {
    if (window.innerWidth > 768) {
      sticky.removeClass("show").hide();
      return;
    }

    const headerHeight = $("header").outerHeight() || 56;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const viewportPos = scrollY + headerHeight;

    if (viewportPos < menuTop) {
      sticky.removeClass("show").hide();
      sticky.attr("aria-hidden", "true");
      return;
    }

    let current = null;
    for (let i = 0; i < titleData.length; i++) {
      if (titleData[i].top <= viewportPos + 2) {
        current = titleData[i];
      } else {
        break;
      }
    }

    if (!current && titleData.length) {
      current = titleData[0];
    }

    if (current) {
      const text = current.el.text().replace(/\s+/g, " ").trim();
      sticky.text(text).show().addClass("show");
      sticky.attr("aria-hidden", "false");
    } else {
      sticky.addClass("show").show();
      sticky.attr("aria-hidden", "false");
    }
  }

  function scheduleRecompute() {
    computePositions();
    updateSticky();
  }

  $(window).on("resize orientationchange load", function () {
    scheduleRecompute();
  });

  $(window).on("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateSticky();
        ticking = false;
      });
      ticking = true;
    }
  });

  scheduleRecompute();
}
