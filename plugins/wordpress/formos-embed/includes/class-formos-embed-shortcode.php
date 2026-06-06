<?php
/**
 * Shortcode renderer for FormOS Embed.
 *
 * @package FormOSEmbed
 */

if (!defined('ABSPATH')) {
    exit;
}

class FormOS_Embed_Shortcode {
    public static function init() {
        add_shortcode('formos_form', array(__CLASS__, 'render'));
    }

    public static function render($attributes) {
        $options = FormOS_Embed_Settings::get_options();
        $attributes = shortcode_atts(
            array(
                'id' => '',
                'height' => $options['default_height'],
                'js' => 'false',
            ),
            $attributes,
            'formos_form'
        );

        $base_url = isset($options['base_url']) ? $options['base_url'] : '';
        $form_id = sanitize_text_field((string) $attributes['id']);
        $height = absint($attributes['height']);
        $use_js = self::truthy($attributes['js']) && !empty($options['use_auto_height']);

        if ($base_url === '' || $form_id === '') {
            return current_user_can('edit_posts')
                ? '<p>' . esc_html__('FormOS embed is missing a Base URL or Form ID.', 'formos-embed') . '</p>'
                : '<!-- FormOS embed is missing configuration. -->';
        }

        if ($height < 200) {
            $height = absint($options['default_height']);
        }

        if ($height < 200) {
            $height = 800;
        }

        if ($height > 5000) {
            $height = 5000;
        }

        if ($use_js) {
            return self::render_script_embed($base_url, $form_id);
        }

        return self::render_iframe($base_url, $form_id, $height);
    }

    private static function truthy($value) {
        $value = strtolower(sanitize_text_field((string) $value));
        return in_array($value, array('1', 'true', 'yes', 'on'), true);
    }

    private static function embed_url($base_url, $form_id) {
        return trailingslashit($base_url) . 'embed/forms/' . rawurlencode($form_id);
    }

    private static function render_iframe($base_url, $form_id, $height) {
        $src = self::embed_url($base_url, $form_id);

        return sprintf(
            '<iframe src="%1$s" width="100%%" height="%2$d" frameborder="0" style="border:0;width:100%%;min-height:%2$dpx;" loading="lazy" title="%3$s"></iframe>',
            esc_url($src),
            absint($height),
            esc_attr(sprintf(__('FormOS form %s', 'formos-embed'), $form_id))
        );
    }

    private static function render_script_embed($base_url, $form_id) {
        $script_src = trailingslashit($base_url) . 'embed.js';

        return sprintf(
            '<div data-formos-form="%1$s"></div><script src="%2$s" async></script>',
            esc_attr($form_id),
            esc_url($script_src)
        );
    }
}
