(function (blocks, blockEditor, components, element, i18n) {
    var el = element.createElement;
    var __ = i18n.__;
    var InspectorControls = blockEditor.InspectorControls;
    var useBlockProps = blockEditor.useBlockProps;
    var PanelBody = components.PanelBody;
    var TextControl = components.TextControl;
    var ToggleControl = components.ToggleControl;
    var RangeControl = components.RangeControl;
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
