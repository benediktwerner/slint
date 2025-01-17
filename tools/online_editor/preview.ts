// Copyright © SixtyFPS GmbH <info@slint-ui.com>
// SPDX-License-Identifier: GPL-3.0-only OR LicenseRef-Slint-commercial

import slint_init, * as slint from "../../../wasm-interpreter/slint_wasm_interpreter.js";

(async function () {
    await slint_init();

    var base_url = "";

    /// Index by url. Inline documents will use the empty string.
    var loaded_documents: Map<string, string> = new Map;

    let main_source = `
import { SpinBox, Button, CheckBox, Slider, GroupBox } from "std-widgets.slint";
export Demo := Window {
    width:  300px;   // Width in logical pixels. All 'px' units are automatically scaled with screen resolution.
    height: 300px;
    t:= Text {
        text: "Hello World";
        font-size: 24px;
    }
    Image {
        y: 50px;
        source: @image-url("https://slint-ui.com/logo/slint-logo-full-light.svg");
    }
}
`

    function update_preview() {
        let div = document.getElementById("preview") as HTMLDivElement;
        setTimeout(function () { render_or_error(main_source, base_url, div); }, 1);
    }

    async function render_or_error(source: string, base_url: string, div: HTMLDivElement) {
        let canvas_id = 'canvas_' + Math.random().toString(36).substr(2, 9);
        let canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        canvas.id = canvas_id;
        div.innerHTML = "";
        div.appendChild(canvas);

        let { component, error_string } = await slint.compile_from_string_with_style(source, base_url, style, async (url: string): Promise<string> => {
            let file_source = loaded_documents.get(url);
            if (file_source === undefined) {
                const response = await fetch(url);
                let doc = await response.text();
                loaded_documents.set(url, doc);
                return doc;
            }
            return file_source;
        });

        if (error_string != "") {
            let text = document.createTextNode(error_string);
            let p = document.createElement('pre');
            p.appendChild(text);
            div.innerHTML = "<pre style='color: red; background-color:#fee; margin:0'>" + p.innerHTML + "</pre>";
        } else {
            document.getElementById("spinner").remove()
        }

        if (component !== undefined) {
            component.run(canvas_id)
        }
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("snippet");
    const load_url = params.get("load_url");
    const style = params.get("style") || "";

    if (code) {
        main_source = code;
    } else if (load_url) {
        base_url = load_url;
        const response = await fetch(load_url);
        main_source = await response.text();
    }
    update_preview();
})();
