<?php

class ExpertSystem
{
    protected $api_url = 'http://diploma/'; //https://secret-inlet-64004.herokuapp.com/

    public function decode_response($response)
    {
        return json_decode($response, true);
    }

    public function prepare_request($ch, $value = null)
    {
        $url = $this->api_url . urlencode($value) ?: '';

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    }

    public function get_response($ch)
    {
        $response = curl_exec($ch);

        curl_close($ch);

        $decoded_response = $this->decode_response($response);

        $this->validate_response($decoded_response);

        return $decoded_response;
    }

    public function get_statements()
    {
        $ch = curl_init();

        $this->prepare_request($ch);

        return $this->get_response($ch);
    }

    public function get_statement($value)
    {
        $ch = curl_init();

        $this->prepare_request($ch, $value);

        return $this->get_response($ch);
    }

    public function validate_response($response)
    {
        if (array_key_exists('error', $response)) {
            throw new Exception($response['error']);
        }
    }
}
