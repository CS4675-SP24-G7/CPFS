async function CPFSFormSubmit() {
    var CPFSForm = document.forms.CPFSForm;
    var formData = new FormData(CPFSForm);
    var jsonFormData = {
        "product-link": formData.get("product-link"),
        "opt-score": formData.get("opt-score") == "on",
        "opt-reddit": formData.get("opt-reddit") == "on",
        "opt-ad": formData.get("opt-ad") == "on",
    };
    console.log(jsonFormData);
    Amazon_Summary(jsonFormData["product-link"]);
}

async function Amazon_Summary(URL) {
    hideAllIds(["amazon-summary"]);
    showAllIds(["amazon-summary-card", "amazon-summary-loading"]);
    // fetch data from https://crawler.cpfs.site/summary?url=URL
    await fetch("https://crawler.cpfs.site/summary?url=" + URL)
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("amazon-summary-content").innerText =
                data[0].summary;
            hideAllIds(["amazon-summary-loading"]);
            showAllIds(["amazon-summary"]);
        });
}

function hideAllIds(ids) {
    ids.forEach((id) => {
        document.getElementById(id).style.display = "none";
    });
}

function showAllIds(ids) {
    ids.forEach((id) => {
        document.getElementById(id).style.display = "flex";
    });
}

hideAllIds([
    "amazon-summary-card",
    "reddit-summary-card",
    "ad-card",
    "advice-card",
    "amazon-summary-loading",
]);
