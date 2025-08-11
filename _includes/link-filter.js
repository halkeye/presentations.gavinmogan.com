(function () {
  const linksFilterOnChange = function () {
    const linkType = document.querySelector(
      "#links-filter input:checked",
    )?.value;
    document.querySelectorAll("#presentations .presentation").forEach((elm) => {
      if (linkType === "x") {
        elm.classList.remove("hidden");
      } else {
        if (elm.dataset[linkType] == "false") {
          elm.classList.add("hidden");
        }
      }
    });
  };
  Array.from(document.querySelectorAll("#links-filter input")).map((input) =>
    input.addEventListener("change", linksFilterOnChange),
  );
  linksFilterOnChange(); // onready-ish
})();
