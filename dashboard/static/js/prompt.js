const BASE_URL = "http://127.0.0.1:8080";

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
        "analyze-btn",
    ]);

    document.getElementById("details-product-title").innerHTML = "";
    document.getElementById("details-product-url").innerHTML = "";
    document.getElementById("details-product-last-update").innerHTML = "";

    var CPFSForm = document.forms.CPFSForm;
    var formData = new FormData(CPFSForm);

    if (formData.get("product-link") == "") {
        window.alert("Please enter a product link!");
        return;
    }

    if (formData.get("opt-debug-mode") == "on") {
        writeDebug("Debug Mode ON");
        showAllIds(["debug-card"]);
    }

    var jsonFormData = {
        "product-link": formData.get("product-link"),
        "opt-score": formData.get("opt-score") == "on",
        "opt-reddit": formData.get("opt-reddit") == "on",
        "opt-ad": formData.get("opt-ad") == "on",
        "opt-advices": formData.get("opt-advices") == "on",
        "opt-debug-mode": formData.get("opt-debug-mode") == "on",
    };

    // set img src
    document.getElementById(
        "random-img"
    ).src = `https://robohash.org/${jsonFormData["product-link"]}`;

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

    // console.log(scraped_data);

    if (
        scraped_data["data"] == NaN ||
        scraped_data["data"] == undefined ||
        scraped_data["data"] == null ||
        scraped_data["data"] == []
    ) {
        ToastIt("No reviews available for this product!");
        document.getElementById("product-link").value = "";
        window.alert("No reviews available for this product!");
        hideAllIds([
            "amazon-summary-card",
            "reddit-summary-card",
            "ad-card",
            "advices-card",
        ]);
        return;
    } else if (
        scraped_data["data"]["FIVE_STAR"] &&
        scraped_data["data"]["FIVE_STAR"].length == 0 &&
        scraped_data["data"]["FOUR_STAR"] &&
        scraped_data["data"]["FOUR_STAR"].length == 0 &&
        scraped_data["data"]["THREE_STAR"] &&
        scraped_data["data"]["THREE_STAR"].length == 0 &&
        scraped_data["data"]["TWO_STAR"] &&
        scraped_data["data"]["TWO_STAR"].length == 0 &&
        scraped_data["data"]["ONE_STAR"] &&
        scraped_data["data"]["ONE_STAR"].length == 0
    ) {
        ToastIt("No reviews available for this product!");
        document.getElementById("product-link").value = "";
        window.alert("No reviews available for this product!");
        hideAllIds([
            "amazon-summary-card",
            "reddit-summary-card",
            "ad-card",
            "advices-card",
        ]);
        return;
    }

    ToastIt("Filtering Data...");
    const filtered_data = await Get_Filtered_Data(data["product-link"]);

    ToastIt("Data is ready!");
    await Process_Completed(data);
    return;
};

const Process_Completed_No_Filter = async (data) => {
    ToastIt("Product Found, No Filtered Data!");

    const scraped_data = await Scrape(data["product-link"]);

    // console.log(scraped_data);

    if (
        scraped_data["data"] == NaN ||
        scraped_data["data"] == undefined ||
        scraped_data["data"] == null ||
        scraped_data["data"] == []
    ) {
        ToastIt("No reviews available for this product!");
        document.getElementById("product-link").value = "";
        window.alert("No reviews available for this product!");
        hideAllIds([
            "amazon-summary-card",
            "reddit-summary-card",
            "ad-card",
            "advices-card",
        ]);
        return;
    } else if (
        scraped_data["data"]["FIVE_STAR"] &&
        scraped_data["data"]["FIVE_STAR"].length == 0 &&
        scraped_data["data"]["FOUR_STAR"] &&
        scraped_data["data"]["FOUR_STAR"].length == 0 &&
        scraped_data["data"]["THREE_STAR"] &&
        scraped_data["data"]["THREE_STAR"].length == 0 &&
        scraped_data["data"]["TWO_STAR"] &&
        scraped_data["data"]["TWO_STAR"].length == 0 &&
        scraped_data["data"]["ONE_STAR"] &&
        scraped_data["data"]["ONE_STAR"].length == 0
    ) {
        ToastIt("No reviews available for this product!");
        document.getElementById("product-link").value = "";
        window.alert("No reviews available for this product!");
        hideAllIds([
            "amazon-summary-card",
            "reddit-summary-card",
            "ad-card",
            "advices-card",
        ]);
        return;
    }

    ToastIt("Filtering Data...");
    await Get_Filtered_Data(data["product-link"]);

    ToastIt("Data is ready!");
    await Process_Completed(data);
    return;
};

const Process_Completed = async (data) => {
    ToastIt("Product Found with Filtered Data!");

    ToastIt("Getting Product Details...");
    let product_details = (await Get_Product_Details(data["product-link"]))[0];

    ToastIt("Setting Product Details...");
    document.getElementById("details-product-title").innerText =
        product_details["product_title"];
    document.getElementById("details-product-url").innerText =
        product_details["product_url"];
    document.getElementById("details-product-last-update").innerText =
        product_details["last_update"];
    document.getElementById("amazon-original-score").innerText =
        product_details["original_rating"];

    showAllIds(["details-card"]);

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

    if (rating == "N/A") {
        hideAllIds(["reddit-summary-card", "ad-card", "advices-card"]);
        return;
    }

    let promises = [];

    if (data["opt-reddit"]) {
        promises.push(
            (async () => {
                ToastIt("Generating Reddit Summary...");
                let reddit_summary = (
                    await Get_Reddit(data["product-link"])
                )[0];
                // console.log(reddit_summary);
                let reddit_summary_text = reddit_summary["summary"];
                let reddit_rating = reddit_summary["rating"];
                reddit_rating = parseFloat(reddit_rating).toFixed(1);
                document.getElementById("reddit-summary-content").innerText =
                    reddit_summary_text;
                document.getElementById(
                    "reddit-summary-score"
                ).innerText = `${reddit_rating}/5`;
                hideAllIds(["reddit-summary-loading"]);
                showAllIds(["reddit-summary"]);
                ToastIt("Reddit Summary is ready!");
            })()
        );
    }

    if (data["opt-ad"]) {
        promises.push(
            (async () => {
                ToastIt("Generating Advantages and Disadvantages...");
                let ad = (await Get_AD(data["product-link"]))[0];
                let advantages = ad["advantages"];
                let disadvantages = ad["disadvantages"];
                let advantages_list =
                    document.getElementById("advantages-content");
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
            })()
        );
    }

    if (data["opt-advices"]) {
        promises.push(
            (async () => {
                ToastIt("Generating Decision...");
                let decision = (await Get_Decision(data["product-link"]))[0];
                let buying_decision = decision["buying_decision"];
                let reason = decision["reason"];
                if (buying_decision == true) {
                    document.getElementById("advices-suggestion").innerText =
                        "YES";
                } else {
                    document.getElementById("advices-suggestion").innerText =
                        "NO";
                }
                document.getElementById("advices-content").innerText = reason;
                hideAllIds(["advices-loading"]);
                showAllIds(["advices"]);
                ToastIt("Decision is ready!");

                showAllIds(["analyze-btn"]);
            })()
        );
    }

    // Wait for all promises to resolve
    Promise.all(promises).catch((error) => {
        console.error(error);
    });
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
    let filtered_data = await fetch(`${BASE_URL}/filter?url=${URL}`);
    return;
};

const Get_Summary = async (URL) => {
    let summary = await fetch(`${BASE_URL}/summary?url=${URL}`);
    return summary.json();
};

const Get_Reddit = async (URL) => {
    let summary = await fetch(`${BASE_URL}/reddit_summary?url=${URL}`);
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

const Get_Product_Details = async (URL) => {
    let details = await fetch(`${BASE_URL}/product_details?url=${URL}`);
    return details.json();
};
