<?php
/**
 * Admin settings for FormOS Embed.
 *
 * @package FormOSEmbed
 */

if (!defined('ABSPATH')) {
    exit;
}

class FormOS_Embed_Settings {
    public const OPTION_NAME = 'formos_embed_options';
    public const THEMES = array('light', 'dark', 'auto');
    public const BACKGROUNDS = array('white', 'transparent', 'subtle', 'none');
    public const RADII = array(0, 6, 8, 12, 16, 20);
    public const FONTS = array('system', 'sans', 'inherit');

    public static function init() {
        add_action('admin_menu', array(__CLASS__, 'add_settings_page'));
        add_action('admin_init', array(__CLASS__, 'register_settings'));
        add_action('rest_api_init', array(__CLASS__, 'register_rest_routes'));
    }

    public static function add_settings_page() {
        add_options_page(
            __('FormOS Embed', 'formos-embed'),
            __('FormOS Embed', 'formos-embed'),
            'manage_options',
            'formos-embed',
            array(__CLASS__, 'render_settings_page')
        );
    }

    public static function register_settings() {
        register_setting(
            'formos_embed_settings',
            self::OPTION_NAME,
            array(
                'type' => 'array',
                'sanitize_callback' => array(__CLASS__, 'sanitize_options'),
                'default' => self::default_options(),
            )
        );

        add_settings_section(
            'formos_embed_main',
            __('Embed Settings', 'formos-embed'),
            array(__CLASS__, 'render_section_intro'),
            'formos-embed'
        );

        add_settings_field(
            'base_url',
            __('FormOS Base URL', 'formos-embed'),
            array(__CLASS__, 'render_base_url_field'),
            'formos-embed',
            'formos_embed_main'
        );

        add_settings_field(
            'api_token',
            __('FormOS API Token', 'formos-embed'),
            array(__CLASS__, 'render_api_token_field'),
            'formos-embed',
            'formos_embed_main'
        );

        add_settings_field(
            'default_height',
            __('Default Height', 'formos-embed'),
            array(__CLASS__, 'render_default_height_field'),
            'formos-embed',
            'formos_embed_main'
        );

        add_settings_field(
            'use_auto_height',
            __('Use Auto-height Script', 'formos-embed'),
            array(__CLASS__, 'render_use_auto_height_field'),
            'formos-embed',
            'formos_embed_main'
        );

        add_settings_section(
            'formos_embed_appearance',
            __('Default Appearance', 'formos-embed'),
            array(__CLASS__, 'render_appearance_intro'),
            'formos-embed'
        );

        add_settings_field(
            'theme',
            __('Default Theme', 'formos-embed'),
            array(__CLASS__, 'render_theme_field'),
            'formos-embed',
            'formos_embed_appearance'
        );

        add_settings_field(
            'accent',
            __('Accent Color', 'formos-embed'),
            array(__CLASS__, 'render_accent_field'),
            'formos-embed',
            'formos_embed_appearance'
        );

        add_settings_field(
            'background',
            __('Background', 'formos-embed'),
            array(__CLASS__, 'render_background_field'),
            'formos-embed',
            'formos_embed_appearance'
        );

        add_settings_field(
            'surface',
            __('Card Surface Color', 'formos-embed'),
            array(__CLASS__, 'render_surface_field'),
            'formos-embed',
            'formos_embed_appearance'
        );

        add_settings_field(
            'text',
            __('Text Color', 'formos-embed'),
            array(__CLASS__, 'render_text_field'),
            'formos-embed',
            'formos_embed_appearance'
        );

        add_settings_field(
            'border',
            __('Border Color', 'formos-embed'),
            array(__CLASS__, 'render_border_field'),
            'formos-embed',
            'formos_embed_appearance'
        );

        add_settings_field(
            'radius',
            __('Border Radius', 'formos-embed'),
            array(__CLASS__, 'render_radius_field'),
            'formos-embed',
            'formos_embed_appearance'
        );

        add_settings_field(
            'compact',
            __('Compact Mode', 'formos-embed'),
            array(__CLASS__, 'render_compact_field'),
            'formos-embed',
            'formos_embed_appearance'
        );

        add_settings_field(
            'font',
            __('Font Style', 'formos-embed'),
            array(__CLASS__, 'render_font_field'),
            'formos-embed',
            'formos_embed_appearance'
        );
    }

    public static function default_options() {
        return array(
            'base_url' => '',
            'api_token' => '',
            'default_height' => 800,
            'use_auto_height' => 0,
            'theme' => 'light',
            'accent' => '#2563eb',
            'background' => 'transparent',
            'surface' => '',
            'text' => '',
            'border' => '',
            'radius' => 12,
            'compact' => 0,
            'font' => 'system',
        );
    }

    public static function get_options() {
        $options = get_option(self::OPTION_NAME, array());
        return wp_parse_args(is_array($options) ? $options : array(), self::default_options());
    }

    public static function sanitize_options($input) {
        if (!current_user_can('manage_options')) {
            return self::get_options();
        }

        $input = is_array($input) ? $input : array();
        $existing = self::get_options();
        $base_url = isset($input['base_url']) ? sanitize_text_field(wp_unslash($input['base_url'])) : '';
        $api_token = isset($input['api_token']) ? sanitize_text_field(wp_unslash($input['api_token'])) : '';
        $default_height = isset($input['default_height']) ? absint($input['default_height']) : 800;
        $theme = isset($input['theme']) ? sanitize_text_field(wp_unslash($input['theme'])) : 'light';
        $accent = isset($input['accent']) ? sanitize_text_field(wp_unslash($input['accent'])) : '#2563eb';
        $background = isset($input['background']) ? sanitize_text_field(wp_unslash($input['background'])) : 'transparent';
        $surface = isset($input['surface']) ? sanitize_text_field(wp_unslash($input['surface'])) : '';
        $text = isset($input['text']) ? sanitize_text_field(wp_unslash($input['text'])) : '';
        $border = isset($input['border']) ? sanitize_text_field(wp_unslash($input['border'])) : '';
        $radius = isset($input['radius']) ? absint($input['radius']) : 12;
        $font = isset($input['font']) ? sanitize_text_field(wp_unslash($input['font'])) : 'system';

        $base_url = self::sanitize_base_url($base_url);
        $api_token = self::sanitize_api_token($api_token, $existing['api_token']);
        $theme = self::allowed_text($theme, self::THEMES, 'light');
        $accent = self::sanitize_hex_color($accent);
        $background = self::allowed_text($background, self::BACKGROUNDS, 'transparent');
        $surface = self::sanitize_optional_hex_color($surface);
        $text = self::sanitize_optional_hex_color($text);
        $border = self::sanitize_optional_hex_color($border);
        $radius = self::allowed_int($radius, self::RADII, 12);
        $font = self::allowed_text($font, self::FONTS, 'system');

        if ($default_height < 200) {
            $default_height = 800;
        }

        if ($default_height > 5000) {
            $default_height = 5000;
        }

        return array(
            'base_url' => $base_url,
            'api_token' => $api_token,
            'default_height' => $default_height,
            'use_auto_height' => empty($input['use_auto_height']) ? 0 : 1,
            'theme' => $theme,
            'accent' => $accent,
            'background' => $background,
            'surface' => $surface,
            'text' => $text,
            'border' => $border,
            'radius' => $radius,
            'compact' => empty($input['compact']) ? 0 : 1,
            'font' => $font,
        );
    }

    public static function allowed_text($value, $allowed, $fallback) {
        $value = strtolower(sanitize_text_field((string) $value));
        return in_array($value, $allowed, true) ? $value : $fallback;
    }

    public static function allowed_int($value, $allowed, $fallback) {
        $value = absint($value);
        return in_array($value, $allowed, true) ? $value : $fallback;
    }

    public static function sanitize_hex_color($value) {
        $value = trim(sanitize_text_field((string) $value));
        return preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? $value : '#2563eb';
    }

    public static function sanitize_optional_hex_color($value) {
        $value = trim(sanitize_text_field((string) $value));

        if ($value === '') {
            return '';
        }

        return preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? $value : '';
    }

    private static function sanitize_base_url($value) {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        if (
            preg_match('/<[^>]*>/', $value) ||
            preg_match('/^\s*(javascript|data):/i', $value)
        ) {
            add_settings_error(
                self::OPTION_NAME,
                'formos_embed_unsafe_base_url',
                __('FormOS Base URL was rejected because it is unsafe.', 'formos-embed')
            );
            return '';
        }

        $url = esc_url_raw($value, array('http', 'https'));

        if (!$url || !wp_http_validate_url($url)) {
            add_settings_error(
                self::OPTION_NAME,
                'formos_embed_invalid_base_url',
                __('Please enter a valid FormOS Base URL starting with https://.', 'formos-embed')
            );
            return '';
        }

        return untrailingslashit($url);
    }

    private static function sanitize_api_token($value, $existing) {
        $value = trim($value);

        if ($value === '') {
            return is_string($existing) ? $existing : '';
        }

        if (
            preg_match('/<[^>]*>/', $value) ||
            preg_match('/^\s*(javascript|data):/i', $value)
        ) {
            add_settings_error(
                self::OPTION_NAME,
                'formos_embed_unsafe_api_token',
                __('FormOS API token was rejected because it is unsafe.', 'formos-embed')
            );
            return is_string($existing) ? $existing : '';
        }

        return substr($value, 0, 300);
    }

    public static function has_connection() {
        $options = self::get_options();
        return !empty($options['base_url']) && !empty($options['api_token']);
    }

    public static function fetch_forms() {
        $options = self::get_options();

        if (empty($options['base_url']) || empty($options['api_token'])) {
            return new WP_Error(
                'formos_embed_missing_connection',
                __('Add your FormOS Base URL and API token first.', 'formos-embed')
            );
        }

        $response = wp_remote_get(
            trailingslashit($options['base_url']) . 'api/external/forms',
            array(
                'timeout' => 15,
                'headers' => array(
                    'Accept' => 'application/json',
                    'Authorization' => 'Bearer ' . $options['api_token'],
                ),
            )
        );

        if (is_wp_error($response)) {
            return $response;
        }

        $status_code = (int) wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($status_code < 200 || $status_code >= 300) {
            return new WP_Error(
                'formos_embed_connection_failed',
                isset($body['error']) ? sanitize_text_field((string) $body['error']) : __('FormOS rejected the connection.', 'formos-embed')
            );
        }

        $forms = array();
        $items = isset($body['data']) && is_array($body['data']) ? $body['data'] : (is_array($body) ? $body : array());

        foreach ($items as $item) {
            if (!is_array($item) || empty($item['id'])) {
                continue;
            }

            $forms[] = array(
                'id' => sanitize_text_field((string) $item['id']),
                'title' => isset($item['title']) ? sanitize_text_field((string) $item['title']) : __('Untitled form', 'formos-embed'),
                'status' => isset($item['status']) ? sanitize_text_field((string) $item['status']) : '',
                'mode' => isset($item['mode']) ? sanitize_text_field((string) $item['mode']) : '',
                'updatedAt' => isset($item['updatedAt']) ? sanitize_text_field((string) $item['updatedAt']) : '',
                'embedUrl' => isset($item['embedUrl']) ? esc_url_raw((string) $item['embedUrl']) : '',
            );
        }

        return $forms;
    }

    public static function register_rest_routes() {
        register_rest_route(
            'formos-embed/v1',
            '/forms',
            array(
                'methods' => 'GET',
                'callback' => array(__CLASS__, 'rest_get_forms'),
                'permission_callback' => function () {
                    return current_user_can('edit_posts');
                },
            )
        );
    }

    public static function rest_get_forms() {
        $forms = self::fetch_forms();

        if (is_wp_error($forms)) {
            return new WP_REST_Response(
                array('error' => $forms->get_error_message()),
                400
            );
        }

        return rest_ensure_response(array('data' => $forms));
    }

    public static function render_section_intro() {
        echo '<p>' . esc_html__('Connect WordPress to your FormOS website. Add an API token to fetch your published forms in the editor, then insert a shortcode or FormOS block.', 'formos-embed') . '</p>';
    }

    public static function render_appearance_intro() {
        echo '<p>' . esc_html__('Choose safe default styling for embedded forms. Shortcode and block settings can override these values per form. To match your website closely, set accent, card surface, text, and border colors from your WordPress theme.', 'formos-embed') . '</p>';
    }

    public static function render_base_url_field() {
        $options = self::get_options();
        ?>
        <input
            class="regular-text"
            name="<?php echo esc_attr(self::OPTION_NAME); ?>[base_url]"
            placeholder="https://your-formos-domain.com"
            type="url"
            value="<?php echo esc_attr($options['base_url']); ?>"
        />
        <p class="description">
            <?php esc_html_e('Example: https://formos.com.au. The trailing slash is removed automatically.', 'formos-embed'); ?>
        </p>
        <?php
    }

    public static function render_api_token_field() {
        $options = self::get_options();
        ?>
        <input
            autocomplete="off"
            class="regular-text"
            name="<?php echo esc_attr(self::OPTION_NAME); ?>[api_token]"
            placeholder="<?php echo empty($options['api_token']) ? esc_attr__('Paste your FormOS API token', 'formos-embed') : esc_attr__('Token saved - paste a new token to replace it', 'formos-embed'); ?>"
            type="password"
            value=""
        />
        <p class="description">
            <?php esc_html_e('Create this in FormOS Dashboard -> API Tokens. The saved token is not shown again.', 'formos-embed'); ?>
        </p>
        <?php if (!empty($options['api_token'])) : ?>
            <p class="description">
                <strong><?php esc_html_e('Token saved.', 'formos-embed'); ?></strong>
                <?php esc_html_e('Leave this field blank to keep the current token.', 'formos-embed'); ?>
            </p>
        <?php endif; ?>
        <?php
    }

    public static function render_default_height_field() {
        $options = self::get_options();
        ?>
        <input
            min="200"
            max="5000"
            name="<?php echo esc_attr(self::OPTION_NAME); ?>[default_height]"
            type="number"
            value="<?php echo esc_attr((string) $options['default_height']); ?>"
        />
        <p class="description">
            <?php esc_html_e('Default iframe height in pixels. Individual shortcodes can override this.', 'formos-embed'); ?>
        </p>
        <?php
    }

    public static function render_use_auto_height_field() {
        $options = self::get_options();
        ?>
        <label>
            <input
                name="<?php echo esc_attr(self::OPTION_NAME); ?>[use_auto_height]"
                type="checkbox"
                value="1"
                <?php checked(1, (int) $options['use_auto_height']); ?>
            />
            <?php esc_html_e('Allow js="true" shortcodes to use the FormOS auto-height embed script.', 'formos-embed'); ?>
        </label>
        <?php
    }

    private static function render_select($name, $value, $options) {
        ?>
        <select name="<?php echo esc_attr(self::OPTION_NAME); ?>[<?php echo esc_attr($name); ?>]">
            <?php foreach ($options as $option_value => $label) : ?>
                <option value="<?php echo esc_attr((string) $option_value); ?>" <?php selected((string) $value, (string) $option_value); ?>>
                    <?php echo esc_html($label); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <?php
    }

    public static function render_theme_field() {
        $options = self::get_options();
        self::render_select(
            'theme',
            $options['theme'],
            array(
                'light' => __('Light', 'formos-embed'),
                'dark' => __('Dark', 'formos-embed'),
                'auto' => __('Auto', 'formos-embed'),
            )
        );
    }

    public static function render_accent_field() {
        $options = self::get_options();
        ?>
        <input
            name="<?php echo esc_attr(self::OPTION_NAME); ?>[accent]"
            pattern="^#[0-9a-fA-F]{6}$"
            placeholder="#2563eb"
            type="text"
            value="<?php echo esc_attr($options['accent']); ?>"
        />
        <p class="description">
            <?php esc_html_e('Hex color only, for example #2563eb or #7c3aed.', 'formos-embed'); ?>
        </p>
        <?php
    }

    public static function render_background_field() {
        $options = self::get_options();
        self::render_select(
            'background',
            $options['background'],
            array(
                'white' => __('White', 'formos-embed'),
                'transparent' => __('Transparent', 'formos-embed'),
                'subtle' => __('Subtle', 'formos-embed'),
                'none' => __('None', 'formos-embed'),
            )
        );
    }

    private static function render_optional_hex_field($name, $value, $placeholder, $description) {
        ?>
        <input
            name="<?php echo esc_attr(self::OPTION_NAME); ?>[<?php echo esc_attr($name); ?>]"
            pattern="^#[0-9a-fA-F]{6}$"
            placeholder="<?php echo esc_attr($placeholder); ?>"
            type="text"
            value="<?php echo esc_attr($value); ?>"
        />
        <p class="description">
            <?php echo esc_html($description); ?>
        </p>
        <?php
    }

    public static function render_surface_field() {
        $options = self::get_options();
        self::render_optional_hex_field(
            'surface',
            $options['surface'],
            '#ffffff',
            __('Optional. Card/input background color from your website theme.', 'formos-embed')
        );
    }

    public static function render_text_field() {
        $options = self::get_options();
        self::render_optional_hex_field(
            'text',
            $options['text'],
            '#111827',
            __('Optional. Main form text color from your website theme.', 'formos-embed')
        );
    }

    public static function render_border_field() {
        $options = self::get_options();
        self::render_optional_hex_field(
            'border',
            $options['border'],
            '#e5e7eb',
            __('Optional. Border color for cards, inputs, and dividers.', 'formos-embed')
        );
    }

    public static function render_radius_field() {
        $options = self::get_options();
        self::render_select(
            'radius',
            (string) $options['radius'],
            array(
                '0' => '0px',
                '6' => '6px',
                '8' => '8px',
                '12' => '12px',
                '16' => '16px',
                '20' => '20px',
            )
        );
    }

    public static function render_compact_field() {
        $options = self::get_options();
        ?>
        <label>
            <input
                name="<?php echo esc_attr(self::OPTION_NAME); ?>[compact]"
                type="checkbox"
                value="1"
                <?php checked(1, (int) $options['compact']); ?>
            />
            <?php esc_html_e('Use tighter spacing inside embedded forms.', 'formos-embed'); ?>
        </label>
        <?php
    }

    public static function render_font_field() {
        $options = self::get_options();
        self::render_select(
            'font',
            $options['font'],
            array(
                'system' => __('System', 'formos-embed'),
                'sans' => __('Sans', 'formos-embed'),
                'inherit' => __('Inherit from site', 'formos-embed'),
            )
        );
    }

    public static function render_settings_page() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have permission to access this page.', 'formos-embed'));
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('FormOS Embed', 'formos-embed'); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('formos_embed_settings');
                do_settings_sections('formos-embed');
                submit_button();
                ?>
            </form>

            <hr />

            <h2><?php esc_html_e('Connected FormOS Forms', 'formos-embed'); ?></h2>
            <?php if (!self::has_connection()) : ?>
                <p><?php esc_html_e('Save your FormOS Base URL and API token to fetch forms here and inside the block editor.', 'formos-embed'); ?></p>
            <?php else : ?>
                <?php $forms = self::fetch_forms(); ?>
                <?php if (is_wp_error($forms)) : ?>
                    <div class="notice notice-error inline">
                        <p><?php echo esc_html($forms->get_error_message()); ?></p>
                    </div>
                <?php else : ?>
                    <div class="notice notice-success inline">
                        <p><?php echo esc_html(sprintf(__('Connected. %d published form(s) found.', 'formos-embed'), count($forms))); ?></p>
                    </div>
                    <?php if (!empty($forms)) : ?>
                        <table class="widefat striped">
                            <thead>
                                <tr>
                                    <th><?php esc_html_e('Title', 'formos-embed'); ?></th>
                                    <th><?php esc_html_e('Mode', 'formos-embed'); ?></th>
                                    <th><?php esc_html_e('Status', 'formos-embed'); ?></th>
                                    <th><?php esc_html_e('Form ID', 'formos-embed'); ?></th>
                                    <th><?php esc_html_e('Shortcode', 'formos-embed'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($forms as $form) : ?>
                                    <tr>
                                        <td><?php echo esc_html($form['title']); ?></td>
                                        <td><?php echo esc_html($form['mode']); ?></td>
                                        <td><?php echo esc_html($form['status']); ?></td>
                                        <td><code><?php echo esc_html($form['id']); ?></code></td>
                                        <td><code><?php echo esc_html('[formos_form id="' . $form['id'] . '"]'); ?></code></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                <?php endif; ?>
            <?php endif; ?>

            <hr />

            <h2><?php esc_html_e('Shortcode Examples', 'formos-embed'); ?></h2>
            <p><?php esc_html_e('Paste these shortcodes into any WordPress page, post, or shortcode block.', 'formos-embed'); ?></p>
            <pre><code>[formos_form id="abc123"]</code></pre>
            <pre><code>[formos_form id="abc123" height="900"]</code></pre>
            <pre><code>[formos_form id="abc123" js="true"]</code></pre>
            <pre><code>[formos_form id="abc123" theme="auto" accent="#7c3aed"]</code></pre>
            <pre><code>[formos_form id="abc123" bg="transparent" radius="16" compact="true"]</code></pre>
            <pre><code>[formos_form id="abc123" surface="#ffffff" text="#111827" border="#e5e7eb"]</code></pre>
            <p>
                <?php esc_html_e('You can find the Form ID in FormOS on the form detail page. WordPress and Shopify apps can reuse the same embed URL foundation later.', 'formos-embed'); ?>
            </p>

            <?php $preview_url = class_exists('FormOS_Embed_Shortcode') ? FormOS_Embed_Shortcode::preview_url('abc123') : ''; ?>
            <?php if ($preview_url) : ?>
                <h2><?php esc_html_e('Generated URL Preview', 'formos-embed'); ?></h2>
                <p><?php esc_html_e('This is the kind of iframe URL the plugin should generate from your saved defaults. If your page iframe URL does not include these query parameters, the page is using an old/raw iframe or cached output.', 'formos-embed'); ?></p>
                <pre><code><?php echo esc_html($preview_url); ?></code></pre>
            <?php endif; ?>
        </div>
        <?php
    }
}
