# Library

Purpose:

This folder contains the implementations of api calls to the backend server

Use:

ApiClient

- login
  - input: LoginCredentials {username, password}
  - output: userId, username, accessToken, refreshToken
- signup
  - input: SignupData {LoginCredentials, email, age, confirmPassword}
  - output: userId
- uploadImage
  - input: imageFile, location, size, duration, symptoms, additional?
  - output: MedicalReport {id, imageUrl, QuestionnaireData, AnalysisResults, createdAt}
- getUserReports
  - input: requires logged in
  - output: MedicalReport
- deleteUserReport
  - input: reportId
  - output: null
- sendChatMessage
  - input: message
  - output: response
    
Dependencies:

Axios