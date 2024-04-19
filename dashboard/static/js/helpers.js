const hideAllIds = (ids) => {
    ids.forEach((id) => {
        document.getElementById(id).style.display = "none";
    });
};

const showAllIds = (ids) => {
    ids.forEach((id) => {
        document.getElementById(id).style.display = "flex";
    });
};

const writeDebug = (message) => {
    document.getElementById("debug-content").innerHTML =
        `<div>${message}</div>` +
        document.getElementById("debug-content").innerHTML;
};

hideAllIds([
    "amazon-summary-card",
    "amazon-summary",
    "reddit-summary-card",
    "reddit-summary",
    "ad-card",
    "ad",
    "advices-card",
    "advices",
    "debug-card",
]);

writeDebug("App Loaded");

const ToastIt = (message) => {
    writeDebug(message);
    Toastify({
        text: message,
        duration: 2000,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
            background: "linear-gradient(to right, #0EA5E9, #818CF8)",
        },
    }).showToast();
};

const Options_Checked = (options) => {
    var display_options = [];
    var loading_options = [];
    var hidden_options = [];

    display_options.push("amazon-summary-card");
    loading_options.push("amazon-summary-loading");
    hidden_options.push("amazon-summary");

    if (!options["opt-score"]) {
        // traverse to all elements has classname = display-score
        // and set display = none
        var elements = document.getElementsByClassName("display-score");
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.display = "none";
        }
    }
    if (options["opt-reddit"]) {
        display_options.push("reddit-summary-card");
        loading_options.push("reddit-summary-loading");
        hidden_options.push("reddit-summary");
    }
    if (options["opt-ad"]) {
        display_options.push("ad-card");
        loading_options.push("ad-loading");
        hidden_options.push("ad");
    }
    if (options["opt-debug-mode"]) {
        display_options.push("debug-card");
    }
    if (options["opt-advices"]) {
        display_options.push("advices-card");
        loading_options.push("advices-loading");
        hidden_options.push("advices");
    }
    return {
        display_options: display_options,
        loading_options: loading_options,
        hidden_options: hidden_options,
    };
};

// watching the checkbox id opt-debug-mode
document.getElementById("opt-debug-mode").addEventListener("change", (e) => {
    if (e.target.checked) {
        writeDebug("Debug Mode ON");
        showAllIds(["debug-card"]);
    } else {
        writeDebug("Debug Mode OFF");
        hideAllIds(["debug-card"]);
    }
});
