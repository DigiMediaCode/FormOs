(function (blocks, blockEditor, components, element, i18n) {
    var el = element.createElement;
    var __ = i18n.__;
    var InspectorControls = blockEditor.InspectorControls;
    var useBlockProps = blockEditor.useBlockProps;
    var PanelBody = components.PanelBody;
    var TextControl = components.TextControl;
    var ToggleControl = components.ToggleControl;
    var RangeControl = components.RangeControl;
    var SelectControl = components.SelectControl;
    var Notice = components.Notice;

    blocks.registerBlockType('formos/embed-form', {
        title: __('FormOS Form', 'formos-embed'),
        description: __('Embed a FormOS form in this page or post.', 'formos-embed'),
        icon: 'feedback',
        category: 'embed',
        keywords: [
            __('formos', 'formos-embed'),
            __('form', 'formos-embed'),
            __('embed', 'formos-embed')
        ],
        attributes: {
            formId: {
                type: 'string',
                default: ''
            },
            height: {
                type: 'number',
                default: 800
            },
            useJs: {
                type: 'boolean',
                default: false
            },
            theme: {
                type: 'string',
                default: ''
            },
            accent: {
                type: 'string',
                default: ''
            },
            background: {
                type: 'string',
                default: ''
            },
            radius: {
                type: 'string',
                default: ''
            },
            compact: {
                type: 'boolean',
                default: false
            },
            font: {
                type: 'string',
                default: ''
            }
        },
        edit: function (props) {
            var attributes = props.attributes;
            var setAttributes = props.setAttributes;
            var blockProps = useBlockProps({
                className: 'formos-embed-editor-card'
            });
            var shortcode = '[formos_form id="' +
                (attributes.formId || 'FORM_ID') +
                '" height="' +
                (attributes.height || 800) +
                '"' +
                (attributes.useJs ? ' js="true"' : '') +
                (attributes.theme ? ' theme="' + attributes.theme + '"' : '') +
                (attributes.accent ? ' accent="' + attributes.accent + '"' : '') +
                (attributes.background ? ' bg="' + attributes.background + '"' : '') +
                (attributes.radius ? ' radius="' + attributes.radius + '"' : '') +
                (attributes.compact ? ' compact="true"' : '') +
                (attributes.font ? ' font="' + attributes.font + '"' : '') +
                ']';

            return el(
                'div',
                blockProps,
                el(
                    InspectorControls,
                    {},
                    el(
                        PanelBody,
                        {
                            title: __('FormOS Embed Settings', 'formos-embed'),
                            initialOpen: true
                        },
                        el(TextControl, {
                            label: __('Form ID', 'formos-embed'),
                            help: __('Find this in your FormOS form detail page.', 'formos-embed'),
                            value: attributes.formId,
                            onChange: function (value) {
                                setAttributes({ formId: value });
                            }
                        }),
                        el(RangeControl, {
                            label: __('Height', 'formos-embed'),
                            value: attributes.height,
                            min: 200,
                            max: 5000,
                            step: 50,
                            onChange: function (value) {
                                setAttributes({ height: value || 800 });
                            }
                        }),
                        el(ToggleControl, {
                            label: __('Use auto-height script', 'formos-embed'),
                            help: __('Requires auto-height to be enabled in Settings > FormOS Embed.', 'formos-embed'),
                            checked: !!attributes.useJs,
                            onChange: function (value) {
                                setAttributes({ useJs: !!value });
                            }
                        }),
                        el(SelectControl, {
                            label: __('Theme', 'formos-embed'),
                            value: attributes.theme,
                            options: [
                                { label: __('Plugin default', 'formos-embed'), value: '' },
                                { label: __('Light', 'formos-embed'), value: 'light' },
                                { label: __('Dark', 'formos-embed'), value: 'dark' },
                                { label: __('Auto', 'formos-embed'), value: 'auto' }
                            ],
                            onChange: function (value) {
                                setAttributes({ theme: value });
                            }
                        }),
                        el(TextControl, {
                            label: __('Accent color', 'formos-embed'),
                            help: __('Hex only, for example #7c3aed.', 'formos-embed'),
                            value: attributes.accent,
                            onChange: function (value) {
                                setAttributes({ accent: value });
                            }
                        }),
                        el(SelectControl, {
                            label: __('Background', 'formos-embed'),
                            value: attributes.background,
                            options: [
                                { label: __('Plugin default', 'formos-embed'), value: '' },
                                { label: __('White', 'formos-embed'), value: 'white' },
                                { label: __('Transparent', 'formos-embed'), value: 'transparent' },
                                { label: __('Subtle', 'formos-embed'), value: 'subtle' },
                                { label: __('None', 'formos-embed'), value: 'none' }
                            ],
                            onChange: function (value) {
                                setAttributes({ background: value });
                            }
                        }),
                        el(SelectControl, {
                            label: __('Border radius', 'formos-embed'),
                            value: attributes.radius || '',
                            options: [
                                { label: __('Plugin default', 'formos-embed'), value: '' },
                                { label: '0px', value: '0' },
                                { label: '6px', value: '6' },
                                { label: '8px', value: '8' },
                                { label: '12px', value: '12' },
                                { label: '16px', value: '16' },
                                { label: '20px', value: '20' }
                            ],
                            onChange: function (value) {
                                setAttributes({ radius: value });
                            }
                        }),
                        el(ToggleControl, {
                            label: __('Compact mode', 'formos-embed'),
                            checked: !!attributes.compact,
                            onChange: function (value) {
                                setAttributes({ compact: !!value });
                            }
                        }),
                        el(SelectControl, {
                            label: __('Font style', 'formos-embed'),
                            value: attributes.font,
                            options: [
                                { label: __('Plugin default', 'formos-embed'), value: '' },
                                { label: __('System', 'formos-embed'), value: 'system' },
                                { label: __('Sans', 'formos-embed'), value: 'sans' },
                                { label: __('Inherit from site', 'formos-embed'), value: 'inherit' }
                            ],
                            onChange: function (value) {
                                setAttributes({ font: value });
                            }
                        })
                    )
                ),
                el(
                    'div',
                    {
                        style: {
                            border: '1px solid #dbe3ef',
                            borderRadius: '12px',
                            padding: '18px',
                            background: '#f8fafc'
                        }
                    },
                    el(
                        'strong',
                        {
                            style: {
                                display: 'block',
                                fontSize: '15px',
                                marginBottom: '6px'
                            }
                        },
                        __('FormOS Form', 'formos-embed')
                    ),
                    attributes.formId
                        ? el(
                            'p',
                            {
                                style: {
                                    margin: '0 0 10px',
                                    color: '#475569'
                                }
                            },
                            __('This block will render your FormOS embed on the public page.', 'formos-embed')
                        )
                        : el(
                            Notice,
                            {
                                status: 'warning',
                                isDismissible: false
                            },
                            __('Enter a Form ID in the block settings sidebar.', 'formos-embed')
                        ),
                    el(
                        'code',
                        {
                            style: {
                                display: 'block',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word'
                            }
                        },
                        shortcode
                    )
                )
            );
        },
        save: function () {
            return null;
        }
    });
})(
    window.wp.blocks,
    window.wp.blockEditor,
    window.wp.components,
    window.wp.element,
    window.wp.i18n
);
