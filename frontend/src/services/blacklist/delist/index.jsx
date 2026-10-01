import axios from "axios";

const DelistService = () => {

  const delistRequest = async (body) => {
    try {
      const response = await axios.post('/api/blacklist/delist/', body, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      handleRequestError(error, 'Error sending delist request');
    }
  };

  const handleRequestError = (error, customErrorMessage) => {
    if (error.response) {
      const detail =
        error.response?.data?.detail ||
        `HTTP error! status: ${error.response.status}`;
      throw new Error(detail);
    } else if (error.request) {
      throw new Error('No response received from backend.');
    } else {
      throw new Error(error.message || customErrorMessage || 'Error setting up the request');
    }
  };

  return {
    delistRequest,
  };
};

export default DelistService;
