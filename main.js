class SingleUpType {
    constructor(name, col, subtitle) {
        this.name = name;
        this.col = col;
        this.subtitle = subtitle;
    }
}

const UpType = {
    Yes: new SingleUpType("Yes!", "green", "Everything is up, hopefully."),
    YesWithACatch: new SingleUpType("Yes<small>*</small>", "#0cdb00", "(But there are network issues)"),
    No: new SingleUpType("No.", "red", "No.")
};

// thanks dt
// still using this 3 years later
String.template = function(strings, ...values) {
    return strings.reduce((out, str, i) =>
        out + str + (values[i] ?? ""), "");
}

function $(...args) {
    let a = String.template(...args)
    let tag = a.replace(/[#.][^#.]+/gm, "").trimEnd().trimStart()
    let id = a.match(/[#][^#.]+/gm)
    let classes = a.match(/[.][^#.]+/gm)
    let elem = document.createElement(tag)
    if (id) elem.id = id.join(" ").replaceAll("#","")
    if (classes) elem.className = classes.join(" ").replaceAll(".","")
    elem.$ = function(props) {
        for (const [k,v] of Object.entries(props) ) {
            elem[k]=v
        }
        return elem
    }
    return function(...e) {
        elem.append(...e)
        return elem
    }
}

/**
 * @param {Promise<any>} promise
 * @param {number} length
 * @returns
 */
function timeout(promise, length) {
    return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
            reject(`timed out after ${length}ms`)
        }, length);

        promise
            .then(result => {
                clearTimeout(timeout);
                resolve(result);
            })
            .catch(err => {
                clearTimeout(timeout);
                reject(err);
            });
    })
}

/**
 * @param {string} outageType
 */
function formatOutageType(outageType) {
    outageType = outageType.replace("Outage", "");
    return outageType[0].toUpperCase() + outageType.slice(1);
}

/**
 * @param {SingleUpType} label
 */
function result(label) {
    /** @type {HTMLSpanElement} */
    const span = document.querySelector("span#result");
    span.innerHTML = label.name;
    span.style.color = label.col;

    document.querySelector("span#subtitle").innerHTML = label.subtitle;
    document.querySelector("span#loading").style.display = "none";
}

(async () => {
    // try fetching undefined0.dev with a short timeout
    try {
        await timeout(fetch("https://undefined0.dev/files/server-status"), 5000)
    } catch(_) {
        result(UpType.No)
        return;
    }

    // try testing the isp
    let res = await fetch("https://isp-test.undefined0.dev/status");
    let json = await res.json();

    if (json["outages"].length == 0) {
        result(UpType.Yes);
        return;
    }

    result(UpType.YesWithACatch);

    for (let [i, issue] of Object.entries(json["outages"])) {
        console.log(issue);
        document.querySelector("main").appendChild($`div.issue`(
            $`span.number`(`#${parseInt(i) + 1}`),

            $`span.pair`(
                $`span.type`(formatOutageType(issue["outageType"])),
                $`span.status`(`"${issue["outageStatus"]}"`),
            ),

            $`span.splitter`(),
            $`span.description`(`"${issue["customerDescription"]}"`),

            $`span.fixed-at`(`Will be fixed on ${new Date(issue["estimatedFixTime"]).toLocaleDateString()}.`)
        ));
    }
})();
