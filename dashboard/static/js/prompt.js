const BASE_URL = "https://crawler.cpfs.site";

const CPFSFormSubmit = async () => {
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

    var CPFSForm = document.forms.CPFSForm;
    var formData = new FormData(CPFSForm);
    var jsonFormData = {
        "product-link": formData.get("product-link"),
        "opt-score": formData.get("opt-score") == "on",
        "opt-reddit": formData.get("opt-reddit") == "on",
        "opt-ad": formData.get("opt-ad") == "on",
        "opt-advices": formData.get("opt-advices") == "on",
        "opt-debug-mode": formData.get("opt-debug-mode") == "on",
    };
    writeDebug("Working on " + jsonFormData["product-link"] + "...");

    const status = await Get_Status(jsonFormData["product-link"]);
    writeDebug("Product status: " + status.status);

    options_checked = Options_Checked(jsonFormData);
    hideAllIds(options_checked.hidden_options);
    showAllIds(options_checked.loading_options);
    showAllIds(options_checked.display_options);

    if (status.status == "NOT_FOUND") {
        await Process_Not_Found(jsonFormData);
        return;
    } else if (
        status.status == "COMPLETED" &&
        status.filtered != undefined &&
        status.filtered == true
    ) {
        await Process_Completed(jsonFormData);
        return;
    } else if (
        (status.status == "COMPLETED" &&
            status.filtered != undefined &&
            status.filtered == false) ||
        (status.status == "COMPLETED" && status.filtered == undefined)
    ) {
        await Process_Completed_No_Filter(jsonFormData);
        return;
    }
};

const Process_Not_Found = async (data) => {
    ToastIt("Product Not Found!");

    ToastIt("Scraping Data...");
    const scraped_data = await Scrape(data["product-link"]);

    ToastIt("Filtering Data...");
    const filtered_data = await Get_Filtered_Data(data["product-link"]);

    ToastIt("Data is ready!");
    Process_Completed(data);
    return;
};

const Process_Completed_No_Filter = async (data) => {
    ToastIt("Product Found, No Filtered Data!");

    ToastIt("Filtering Data...");
    const filtered_data = await Get_Filtered_Data(data["product-link"]);

    ToastIt("Data is ready!");
    Process_Completed(data);
    return;
};

const Process_Completed = async (data) => {
    ToastIt("Product Found with Filtered Data!");

    // Get Summary && Set Summary
    ToastIt("Generating Summary...");
    let amazon_summary = (await Get_Summary(data["product-link"]))[0];
    let summary = amazon_summary["summary"];
    let rating = amazon_summary["rating"];

    // round 1 decimal
    rating = parseFloat(rating).toFixed(1);

    document.getElementById("amazon-summary-content").innerText = summary;
    document.getElementById("amazon-summary-score").innerText = `${rating}/5`;

    hideAllIds(["amazon-summary-loading"]);
    showAllIds(["amazon-summary"]);

    ToastIt("Summary is ready!");

    if (data["opt-ad"]) {
        ToastIt("Generating Advantages and Disadvantages...");
        // Get AD && Set AD
        let ad = (await Get_AD(data["product-link"]))[0];
        let advantages = ad["advantages"];
        let disadvantages = ad["disadvantages"];

        let advantages_list = document.getElementById("advantages-content");
        let disadvantages_list = document.getElementById(
            "disadvantages-content"
        );

        advantages_list.innerHTML = "";
        disadvantages_list.innerHTML = "";

        advantages.forEach((element) => {
            let divE = document.createElement("div");
            divE.innerText = element;
            advantages_list.appendChild(divE);
        });

        disadvantages.forEach((element) => {
            let divE = document.createElement("div");
            divE.innerText = element;
            disadvantages_list.appendChild(divE);
        });

        hideAllIds(["ad-loading"]);
        showAllIds(["ad"]);
        ToastIt("Advantages and Disadvantages are ready!");
    }

    if (data["opt-advices"]) {
        ToastIt("Generating Decision...");
        // Get Decisions && Set Decisions
        let decision = (await Get_Decision(data["product-link"]))[0];
        let buying_decision = decision["buying_decision"];
        let reason = decision["reason"];

        if (buying_decision == true) {
            document.getElementById("advices-suggestion").innerText = "YES";
        } else {
            document.getElementById("advices-suggestion").innerText = "NO";
        }
        document.getElementById("advices-content").innerText = reason;

        hideAllIds(["advices-loading"]);
        showAllIds(["advices"]);

        ToastIt("Decision is ready!");
    }
};

const Get_Status = async (URL) => {
    let status = await fetch(`${BASE_URL}/get_status?url=${URL}`);
    return status.json();
};

const Scrape = async (URL) => {
    let data = await fetch(`${BASE_URL}/scrape?url=${URL}`);
    return data.json();
};

const Get_Filtered_Data = async (URL) => {
    let filtered_data = await fetch(`${BASE_URL}/filter?url=${URL}`, {
        mode: "no-cors",
    });
    return filtered_data.json();
};

const Get_Summary = async (URL) => {
    let summary = await fetch(`${BASE_URL}/summary?url=${URL}`);
    return summary.json();
};

const Get_AD = async (URL) => {
    let ad = await fetch(`${BASE_URL}/ad?url=${URL}`);
    return ad.json();
};

const Get_Decision = async (URL) => {
    let decision = await fetch(`${BASE_URL}/decision?url=${URL}`);
    return decision.json();
};
