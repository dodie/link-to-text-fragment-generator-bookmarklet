(function(){
	const existingPanel = document.querySelector("#bookmarkletUrlScrollToTextFragment");
	if (existingPanel) {
		existingPanel.parentNode.removeChild(existingPanel);
		return false;
	}

	function getSelectedWords() {
		const selection = window.getSelection();
		if (selection.rangeCount === 0) return null;

		const range = selection.getRangeAt(0);
		let selectedText = selection.toString();
		
		if (selectedText.trim() === "") return null;
		
		// Clone and expand the range to capture the word before the selection
		const startRange = range.cloneRange();
		startRange.collapse(true);
		startRange.setStart(startRange.startContainer, 0);
		
		const completeTextBefore = startRange.toString();
		let beforeText = undefined;
		if (completeTextBefore[completeTextBefore.length - 1] !== " " && selectedText[0] !== " ") {
			const wordsBefore = completeTextBefore.split(/\s+/);
			selectedText = wordsBefore[wordsBefore.length - 1] + selectedText;
			beforeText = wordsBefore.slice(0, wordsBefore.length - 1).join(" ");
		} else {
			beforeText = completeTextBefore;
		}
		
		// Clone and expand the range to capture the word after the selection
		const endRange = range.cloneRange();
		endRange.collapse(false);
		endRange.setEnd(endRange.endContainer, endRange.endContainer.length);
		
		const completeTextAfter = endRange.toString();
		let afterText = undefined;
		if (completeTextAfter[0] !== " " && selectedText[selectedText.length - 1] !== " ") {
			wordsAfter = completeTextAfter.split(/\s+/);
			selectedText = selectedText + wordsAfter[0];
			afterText = wordsAfter.slice(1, wordsAfter.length).join(" ");
		} else {
			afterText = completeTextAfter;
		}
		
		return {
			beforeWords: beforeText,
			selectedWords: selectedText.trim(),
			afterWords: afterText
		};
	}
	
	function addSelection(textStart, textEnd, prefix, suffix) {
		function addProperty(config, labelText, required, inputValue) {
			const propertyContainer = document.createElement("div");
			config.appendChild(propertyContainer);
		
			const label = document.createElement("label");
			label.innerHTML = labelText;
			label.style.display = "inline-block";
			label.style.width = "15%";
			propertyContainer.appendChild(label);
			
			const input = document.createElement("input");
			input.style.width = "80%";
			if (inputValue) {
				input.value = inputValue;
			}
			propertyContainer.appendChild(input);
			input.addEventListener("keyup", (event) => {
				if (required) {
					if (input.value.trim() === "") {
						input.style.background = "#ff8c8c";
					} else {
						input.style.background = "";
					}
				}
				renderLink();
			});
		}
		
		const config = document.createElement("div");
		addProperty(config, "textStart*:", true, textStart);
		addProperty(config, "textEnd:", false, textEnd);
		addProperty(config, "prefix:", false, prefix);
		addProperty(config, "suffix:", false, suffix);
		
		config.style.borderBottom = "1px solid #DADADA";
		config.style.paddingBottom = "3px";
		config.style.marginBottom = "3px";
		
		configs.appendChild(config);
	}
	
	function createTextFragment(textStart, textEnd, prefix, suffix) {
		let result = "text=";
		
		if (prefix !== "") {
			result = result + encodeURIComponent(prefix) + "-,";
		}
		
		if (textStart !== "") {
			result = result + encodeURIComponent(textStart);
		}
		else{
			throw new Error('textStart is mandatory for a text fragment');
		}
		
		if (textEnd !== "") {
			result = result + "," + encodeURIComponent(textEnd);
		}
		
		if (suffix !== "") {
			result = result + ",-" + encodeURIComponent(suffix);
		}
		
		
		return result;
	}
	
	function renderLink() {
		const textFragments = []
		configs.childNodes.forEach((config) => {
			const textStartElement = config.childNodes[0].querySelector("input");
			const textEndElement = config.childNodes[1].querySelector("input");
			const prefixElement = config.childNodes[2].querySelector("input");
			const suffixElement = config.childNodes[3].querySelector("input");
			
			const textStart = textStartElement.value.trim();
			if (textStart === "") {
				return;
			}
			
			const textEnd = textEndElement.disabled ? "" : textEndElement.value.trim();
			const prefix = prefixElement.disabled ? "" : prefixElement.value.trim();
			const suffix = suffixElement.disabled ? "" : suffixElement.value.trim();
			textFragments.push(createTextFragment(textStart, textEnd, prefix, suffix));
		});
		
		if (textFragments.length === 0) {
			resultLink.innerHTML = "<i>Select some text on the page and click <b>add</b>.</i>";
			return;
		}
		url = window.location.href + "#:~:" + textFragments.join("&");
		resultLink.innerHTML = "URL with <b>Text Fragment:</b><br/> <a target='_blank' href='"+url+"'>" + url + "</a><br/>";
	}
	
	// Init UI
	const container = document.createElement("div");
	container.id = "bookmarkletUrlScrollToTextFragment";
	container.style.position = 'fixed';
	container.style.right = '5px';
	container.style.bottom = '5px';
	container.style.padding = '15px';
	container.style.border = '1px solid rgb(150, 150, 150)';
	container.style.zIndex = 999999999999999;
	container.style.backgroundColor = 'white';
	container.style.width = '500px';
	
	const resultLink = document.createElement("div");
	resultLink.style.marginBottom = '10px';
	container.appendChild(resultLink);
	
	
	const configs = document.createElement("div");
	container.appendChild(configs);
	
	const addButton = document.createElement("input");
	addButton.type = "button";
	addButton.value = "add";
	addButton.addEventListener('click', () => {
		const selectedWords = getSelectedWords();
		if (!selectedWords) {
			alertMessage.innerHTML = "<br>Select something on the page to enable adding more fragments";
			return;
		}
		alertMessage.innerHTML = "";
		if (addWithContextCheckbox.checked) {
			addSelection(selectedWords["selectedWords"], "", selectedWords["beforeWords"],  selectedWords["afterWords"]);
		} else {
			addSelection(selectedWords["selectedWords"], "", "", "");
		}
		renderLink();
	});
	addButton.style.marginTop = '10px';
	container.appendChild(addButton);
	
	const addWithContextCheckbox = document.createElement("input");
	addWithContextCheckbox.type = "checkbox";
	container.appendChild(addWithContextCheckbox);
	
	const addWithContextLabel = document.createElement("label");
	addWithContextLabel.innerHTML = "Add prefix and suffix based on context (longer link, more precise)"
	container.appendChild(addWithContextLabel);
	
	const alertMessage = document.createElement("span");
	alertMessage.style.color = "red";
	container.appendChild(alertMessage);
	
	document.body.appendChild(container);

	// Init state
	const textFragments = []
	
	const selectedWords = getSelectedWords();
	
	if (selectedWords) {
		addSelection(selectedWords["selectedWords"], "", "", "");
	}
	renderLink();
})();
