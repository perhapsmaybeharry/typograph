/*

	TYPOGRAPH
	simple typesetting framework

	Harry Wang
	24 Aug 2023

*/

// goes through the document and updates tag numbers
function generateTagNumbers() {

	// supported tags
	var tag_counter = { chp: 0, sec: 0, sse: 0, sss: 0, eqn: 0, fig: 0, tbl: 0 };

	// list of tag ids for table of contents generation
	var tags_list = [];

	// use dfs to number tags
	var visit_stack = [ document.body ];
	var curr_ele = 0;

	while (visit_stack.length > 0) {

		// get current element from the stack
		curr_ele = visit_stack.pop();

		// add any children to the stack
		Array.from(curr_ele.children).reverse().forEach(child => visit_stack.push(child));

		// check if current element is a tag element
		// update counter, and generate tag innerHTML and id
		switch (curr_ele.tagName) {
			case "CHP":
				tag_counter.chp += 1;
				tag_counter.sec = 0;
				tag_counter.sse = 0;
				tag_counter.sss = 0;
				curr_ele.id = `chp-${tag_counter.chp}`;
				curr_ele.innerHTML = `<tagnum>${tag_counter.chp}</tagnum><span>${curr_ele.innerHTML}</span>`;
				tags_list.push(curr_ele.id);
				break;
			case "SEC":
				tag_counter.sec += 1;
				tag_counter.sse = 0;
				tag_counter.sss = 0;
				curr_ele.id = `sec-${tag_counter.chp}-${tag_counter.sec}`;
				curr_ele.innerHTML = `<tagnum>${tag_counter.chp}.${tag_counter.sec}</tagnum><span>${curr_ele.innerHTML}</span>`;
				tags_list.push(curr_ele.id);
				break;
			case "SSE":
				tag_counter.sse += 1;
				tag_counter.sss = 0;
				curr_ele.id = `sse-${tag_counter.chp}-${tag_counter.sec}-${tag_counter.sse}`;
				curr_ele.innerHTML = `<tagnum>${tag_counter.chp}.${tag_counter.sec}.${tag_counter.sse}</tagnum><span>${curr_ele.innerHTML}</span>`;
				tags_list.push(curr_ele.id);
				break;
			case "SSS":
				tag_counter.sss += 1;
				curr_ele.id = `sss-${tag_counter.chp}-${tag_counter.sec}-${tag_counter.sse}-${tag_counter.sss}`;
				curr_ele.innerHTML = `<tagnum>${tag_counter.chp}.${tag_counter.sec}.${tag_counter.sse}.${tag_counter.sss}</tagnum><span>${curr_ele.innerHTML}</span>`;
				tags_list.push(curr_ele.id);
				break;
			case "EQN":
				tag_counter.eqn += 1;
				curr_ele.id = `eqn-${tag_counter.eqn}`
				curr_ele.innerHTML = `<tagnum>Equation ${tag_counter.eqn}</tagnum><span>${curr_ele.innerHTML}</span>`;
				tags_list.push(curr_ele.id);
				break;
			case "FIG":
				tag_counter.fig += 1;
				curr_ele.id = `fig-${tag_counter.fig}`
				curr_ele.innerHTML = `<tagnum>Figure ${tag_counter.fig}</tagnum><span>${curr_ele.innerHTML}</span>`;
				tags_list.push(curr_ele.id);
				break;
			case "TBL":
				tag_counter.tbl += 1;
				curr_ele.id = `tbl-${tag_counter.tbl}`
				curr_ele.innerHTML = `<tagnum>Table ${tag_counter.tbl}</tagnum><span>${curr_ele.innerHTML}</span>`;
				tags_list.push(curr_ele.id);
				break;
		}
	}

	return tags_list;
}

// builds the table of contents for the document, generating tags in the process
function generateTableOfContents() {

	// generate tags and get tags_list
	var tags_list = generateTagNumbers();

	// build table
	var table_html = "<h1 style='margin-top: 0;'>Contents</h1>", tag_type = "", indent_level = 0;
	tags_list.forEach(function (tag_id) {

		// figure out appropriate indent
		tag_type = tag_id.substring(0, 3);
		switch (tag_type) {
			case "chp":
				indent_level = 0;
				break;
			case "sec":
				indent_level = 1;
				break;
			case "sse":
				indent_level = 2;
				break;
			case "sss":
				indent_level = 3;
				break;
		}

		table_html += `<toc-${tag_type}${indent_level > 0 ? ` class='typograph-indent${(indent_level + ((tag_type == "eqn" || tag_type == "fig") ? 1 : 0))}'` : ""}><a href="#${tag_id}">${Array.from(document.getElementById(tag_id).children).map(ele => ele.innerText.trim()).join("&nbsp;&nbsp;&nbsp;&nbsp;")}</a></toc-${tag_type}>`
	});

	// write out
	var toc_ele = document.getElementsByTagName("toc");
	if (toc_ele.length > 0) toc_ele[0].innerHTML = table_html;

	// check if the url was supposed to jump somewhere but didn't because the ids weren't loaded in yet
	if (window.location.hash != "") document.getElementById(window.location.hash.substring(1)).scrollIntoView({ alignToTop: true, behavior: "smooth" });
}

// renders the numbered and lettered lists
function generateLists() {

	// get the lists to render
	var numlists = Array.from(document.getElementsByTagName("numlist"));
	var letterlists = Array.from(document.getElementsByTagName("letterlist"));

	// assign each list an id so we don't lose it when shuffling things around
	// also convert each list to a list of the ids
	for (var pos = 0; pos < numlists.length; pos += 1) {
		numlists[pos].id = `nl-${pos}`;
		numlists[pos] = numlists[pos].id;
	}
	for (var pos = 0; pos < letterlists.length; pos += 1) {
		letterlists[pos].id = `ll-${pos}`;
		letterlists[pos] = letterlists[pos].id
	}

	// process lists
	numlists.concat(letterlists).forEach(function (list_id) {

		// wrap each internal element in a list-row wrapper
		var list_html = "", list = document.getElementById(list_id), list_is_nl = list_id.substring(0, 2) == "nl", list_count = list_is_nl ? 1 : 'a';
		Array.from(list.children).forEach(function (child) {

			// if element is flagged with a listskip attribute, don't wrap it
			if (child.attributes["listskip"] != undefined) {
				list_html += child.outerHTML;
				return;
			};
			
			// wrap element and increment counter
			list_html += `<div class="typograph-list-row"><div class="typograph-list-outer"><p class="typograph-list-num">${list_count}</p></div><div class="typograph-list-inner">${child.outerHTML}</div></div>`
			if (list_is_nl) { list_count += 1; }
			else { list_count = list_count == 'z' ? 'a' : String.fromCharCode(list_count.charCodeAt(0) + 1); }
		});

		// write out
		list.innerHTML = list_html;
	});
}

// renders the code blocks
function generateCode() {

	// wrap each line in a code block in a codeblk-line wrapper
	var code_blocks = Array.from(document.getElementsByTagName("codeblk"));
	code_blocks.forEach(function (block) {
		block.innerHTML = block.innerHTML.trim().split("\n").map(line => `<div class="typograph-codeblk-line">${line.replaceAll("\t", "&nbsp;&nbsp;&nbsp;&nbsp;").trim()}</div>`).join("");
	});
}

// updates the date, if not written
function generateDate() {

	// get empty <date> tags
	var date_now = new Date(), date_str = `${date_now.getDate()} ${date_now.toLocaleString('default', { month: 'long' })} ${date_now.getFullYear()}`;
	Array.from(document.getElementsByTagName("date")).filter(ele => ele.innerHTML == "").map(ele => ele.innerHTML = date_str);
}

// does everything
function renderDocument() {
	generateTableOfContents();
	generateLists();
	generateCode();
	generateDate();
}