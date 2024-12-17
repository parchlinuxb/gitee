const svgList = {
  home: "node_modules/remixicon/icons/Buildings/home-4-fill.svg",
};

const ejs = require("ejs"),
  svgo = require("svgo"),
  fs = require("fs");

const icons = {};

for (const iconName in svgList) {
  const svgFileName = svgList[iconName];
  try {
    const svgContent = fs.readFileSync(svgFileName, { encoding: "utf8" });
    const svgoResult = svgo.optimize(svgContent, {
      path: svgFileName,
      multipass: true,
      plugins: [
        {
          name: "removeTitle",
        },
        {
          name: "removeXMLNS",
        },
        {
          name: "addAttributesToSVGElement",
          params: {
            attributes: [{ class: "icon", "aria-hidden": "true" }],
          },
        },
      ],
    });
    icons[iconName] = svgoResult.data.replace("'", "\\'");
  } catch (err) {
    console.error(`Error while processing ${svgFileName}`);
    Object.keys(icons).forEach((key) => {
      delete icons[key];
    });
    break;
  }
}

const template = `{# this file was generated by svg2jinja.js #}
{%- set icons = {
<% for (const iconName in icons) { %>  '<%- iconName %>':'<%- icons[iconName] %>',
<% } %>
}
-%}

{% macro icon(action, alt) -%}
  {{ icons[action] | safe }}
{%- endmacro %}

{% macro icon_small(action) -%}
  {{ icons[action] | replace("icon", "icon-small") | safe }}
{%- endmacro %}

{% macro icon_big(action, alt) -%}
{{ icons[action] | replace("icon", "icon-big") | safe }}
{%- endmacro %}
`;

const result = ejs.render(template, { icons });
fs.writeFileSync("../../../templates/smart/icons.html", result, {
  encoding: "utf8",
});

if (Object.keys(icons).length > 0) {
  console.log("Successfully generated icons.html");
}
